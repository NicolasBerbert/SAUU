import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import { logger } from "@/lib/logger";

// Rota de simulação de checkout — APENAS DESENVOLVIMENTO.
// Simula aprovação imediata sem passar pelo Mercado Pago.
// Cria EventRegistration e/ou Order com status APPROVED diretamente.

const checkoutSimularSchema = z.object({
  incluirInscricao: z.boolean(),
  items: z.array(
    z.object({
      productId: z.string().cuid(),
      quantity: z.number().int().positive().max(10),
    })
  ).max(20),
}).refine(
  (data) => data.incluirInscricao || data.items.length > 0,
  { message: "O carrinho está vazio." }
);

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Não disponível" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  let parsed;
  try {
    parsed = checkoutSimularSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { incluirInscricao, items } = parsed;

  try {
    const registrationAmount = Number(process.env.EVENT_REGISTRATION_PRICE ?? "50");

    // Busca produtos
    let products: Array<{ id: string; name: string; price: { toNumber(): number }; stock: number }> = [];
    if (items.length > 0) {
      const productIds = items.map((i) => i.productId);
      products = await prisma.product.findMany({
        where: { id: { in: productIds }, active: true },
      });
      if (products.length !== items.length) {
        return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 });
      }
    }

    await prisma.$transaction(async (tx) => {
      // Simula aprovação da inscrição
      if (incluirInscricao) {
        await tx.eventRegistration.upsert({
          where: { userId: session.user.id },
          update: { paymentStatus: "APPROVED", amount: registrationAmount },
          create: {
            userId: session.user.id,
            paymentStatus: "APPROVED",
            amount: registrationAmount,
          },
        });
      }

      // Simula aprovação do pedido com reserva de estoque
      if (items.length > 0) {
        const shopTotal = items.reduce((sum, item) => {
          const product = products.find((p) => p.id === item.productId)!;
          return sum + product.price.toNumber() * item.quantity;
        }, 0);

        for (const item of items) {
          const atualizado = await tx.product.updateMany({
            where: { id: item.productId, stock: { gte: item.quantity }, active: true },
            data: { stock: { decrement: item.quantity } },
          });
          if (atualizado.count === 0) {
            const product = products.find((p) => p.id === item.productId)!;
            throw new Error(`STOCK_INSUFFICIENT:${product.name}`);
          }
        }

        await tx.order.create({
          data: {
            userId: session.user.id,
            total: shopTotal,
            status: "APPROVED",
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((p) => p.id === item.productId)!.price.toNumber(),
              })),
            },
          },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STOCK_INSUFFICIENT:")) {
      const productName = error.message.replace("STOCK_INSUFFICIENT:", "");
      return NextResponse.json(
        { error: `Estoque insuficiente para ${productName}` },
        { status: 409 }
      );
    }
    logger.error("POST /api/checkout/simular", error);
    return NextResponse.json({ error: "Erro ao simular checkout" }, { status: 500 });
  }
}
