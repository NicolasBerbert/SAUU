import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { audit } from "@/lib/audit";
import { logger } from "@/lib/logger";
import { sendAdminAlert } from "@/lib/alert";

const checkoutSchema = z
  .object({
    incluirInscricao: z.boolean(),
    items: z
      .array(
        z.object({
          productId: z.string().cuid(),
          quantity: z.number().int().positive().max(10),
        })
      )
      .max(20),
  })
  .refine((data) => data.incluirInscricao || data.items.length > 0, {
    message: "O carrinho está vazio.",
  });

// POST /api/checkout — checkout unificado: inscrição e/ou produtos em um único pagamento
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rl = checkRateLimit(`checkout:${session.user.id}`, { windowSec: 3600, max: 10 });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde antes de tentar novamente." },
      { status: 429 }
    );
  }

  let parsed;
  try {
    parsed = checkoutSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
  const { incluirInscricao, items } = parsed;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, emailVerified: true },
  });
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });

  if (incluirInscricao && !user.emailVerified) {
    return NextResponse.json(
      { error: "Confirme seu e-mail antes de realizar o pagamento." },
      { status: 403 }
    );
  }

  if (incluirInscricao) {
    const inscricaoExistente = await prisma.eventRegistration.findUnique({
      where: { userId: session.user.id },
      select: { paymentStatus: true },
    });
    if (inscricaoExistente?.paymentStatus === "APPROVED") {
      return NextResponse.json(
        { error: "Sua inscrição no evento já está confirmada." },
        { status: 409 }
      );
    }
  }

  const registrationAmount = Number(process.env.EVENT_REGISTRATION_PRICE ?? "50");

  let products: Awaited<ReturnType<typeof prisma.product.findMany>> = [];
  if (items.length > 0) {
    const productIds = items.map((i) => i.productId);
    products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });
    if (products.length !== items.length) {
      return NextResponse.json(
        { error: "Um ou mais produtos não encontrados ou indisponíveis." },
        { status: 404 }
      );
    }
  }

  const shopTotal = items.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.productId)!;
    return sum + Number(product.price) * item.quantity;
  }, 0);

  try {
    let orderId: string | null = null;

    await prisma.$transaction(async (tx) => {
      if (incluirInscricao) {
        await tx.eventRegistration.upsert({
          where: { userId: session.user.id },
          update: { paymentStatus: "PENDING", amount: registrationAmount },
          create: { userId: session.user.id, amount: registrationAmount, paymentStatus: "PENDING" },
        });
      }

      if (items.length > 0) {
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

        const order = await tx.order.create({
          data: {
            userId: session.user.id,
            total: shopTotal,
            items: {
              create: items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((p) => p.id === item.productId)!.price,
              })),
            },
          },
        });
        orderId = order.id;
      }
    });

    // Monta line_items do Stripe com todos os itens do carrinho
    const lineItems: Stripe.Checkout.SessionCreateParams["line_items"] = [];

    if (incluirInscricao) {
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: "Inscrição — SAUU Unifil" },
          unit_amount: Math.round(registrationAmount * 100),
        },
        quantity: 1,
      });
    }

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId)!;
      lineItems.push({
        price_data: {
          currency: "brl",
          product_data: { name: product.name },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: item.quantity,
      });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;
    const stripeSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: lineItems,
      success_url: `${baseUrl}/checkout/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancelado`,
      metadata: {
        userId: session.user.id,
        tipo: "combinado",
        incluirInscricao: String(incluirInscricao),
        orderId: orderId ?? "",
      },
    });

    await audit({
      actorId: session.user.id,
      actorType: "USER",
      action: "CHECKOUT_INITIATED",
      entityId: orderId ?? session.user.id,
      entityType: orderId ? "Order" : "EventRegistration",
      metadata: { total: shopTotal + (incluirInscricao ? registrationAmount : 0), incluirInscricao, itemCount: items.length, ip: getClientIp(req) },
    });

    if (items.length > 0) {
      const produtosZerados = await prisma.product.findMany({
        where: { id: { in: items.map((i) => i.productId) }, stock: 0, active: true },
        select: { name: true, id: true },
      });
      if (produtosZerados.length > 0) {
        const nomes = produtosZerados.map((p) => `• ${p.name} (${p.id})`).join("\n");
        await sendAdminAlert(
          "Produto(s) com estoque zerado",
          `Estoque esgotado após checkout:\n\n${nomes}\n\nPedido: ${orderId ?? "sem pedido"}`,
          "AVISO"
        );
      }
    }

    return NextResponse.json({ checkoutUrl: stripeSession.url });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("STOCK_INSUFFICIENT:")) {
      return NextResponse.json(
        { error: `Estoque insuficiente para ${error.message.replace("STOCK_INSUFFICIENT:", "")}` },
        { status: 409 }
      );
    }
    logger.error("POST /api/checkout", error);
    await sendAdminAlert(
      "Erro no checkout unificado",
      `Usuário: ${session.user.id}\nErro: ${error instanceof Error ? error.message : String(error)}`,
      "ERRO"
    );
    return NextResponse.json({ error: "Erro ao processar o pagamento." }, { status: 500 });
  }
}
