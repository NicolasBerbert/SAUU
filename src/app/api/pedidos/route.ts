import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { criarPagamentoPix } from "@/lib/mercadopago";
import { logger } from "@/lib/logger";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { sendAdminAlert } from "@/lib/alert";

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().cuid(),
        quantity: z.number().int().positive().max(10),
      })
    )
    .min(1)
    .max(20),
});

// POST /api/pedidos — cria pedido com reserva atômica de estoque
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rl = checkRateLimit(`pedidos:${session.user.id}`, { windowSec: 3600, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitos pedidos em pouco tempo. Aguarde antes de tentar novamente." },
      { status: 429 }
    );
  }

  let parsed;
  try {
    parsed = orderSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { items } = parsed;

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, active: true },
  });

  if (products.length !== items.length) {
    return NextResponse.json({ error: "Um ou mais produtos não encontrados" }, { status: 404 });
  }

  const total = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  try {
    // Reserva de estoque + criação do pedido em transação atômica.
    // Se o pagamento for cancelado/expirar, o webhook devolve o estoque.
    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity }, active: true },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count === 0) {
          const product = products.find((p) => p.id === item.productId)!;
          throw new Error(`STOCK_INSUFFICIENT:${product.name}`);
        }
      }

      return tx.order.create({
        data: {
          userId: session.user.id,
          total,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: products.find((p) => p.id === item.productId)!.price,
            })),
          },
        },
      });
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, cpf: true },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const pix = await criarPagamentoPix({
      amount: total,
      description: "Pedido loja — SAUU CLBB",
      payerEmail: user!.email,
      payerFirstName: user!.name,
      payerCpf: user!.cpf,
      ref: { userId: session.user.id, tipo: "pedido_loja", orderId: order.id },
      baseUrl,
    });

    await audit({
      actorId: session.user.id,
      actorType: "USER",
      action: "ORDER_CREATED",
      entityId: order.id,
      entityType: "Order",
      metadata: { total, itemCount: items.length, ip: getClientIp(req), productIds },
    });

    const produtosZerados = await prisma.product.findMany({
      where: { id: { in: productIds }, stock: 0, active: true },
      select: { name: true, id: true },
    });
    if (produtosZerados.length > 0) {
      const nomes = produtosZerados.map((p) => `• ${p.name} (${p.id})`).join("\n");
      await sendAdminAlert(
        "Produto(s) com estoque zerado",
        `Os seguintes produtos esgotaram após um pedido:\n\n${nomes}\n\nPedido: ${order.id}`,
        "AVISO"
      );
    }

    return NextResponse.json({ orderId: order.id, checkoutUrl: pix.ticketUrl });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STOCK_INSUFFICIENT:")) {
      return NextResponse.json(
        { error: `Estoque insuficiente para ${error.message.replace("STOCK_INSUFFICIENT:", "")}` },
        { status: 409 }
      );
    }
    logger.error("POST /api/pedidos", error);
    await sendAdminAlert(
      "Erro ao criar pedido na loja",
      `Usuário: ${session.user.id}\nErro: ${error instanceof Error ? error.message : String(error)}`,
      "ERRO"
    );
    return NextResponse.json({ error: "Erro ao criar pedido" }, { status: 500 });
  }
}
