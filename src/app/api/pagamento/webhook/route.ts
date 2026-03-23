import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Assinatura ausente" }, { status: 400 });
  }

  let event: Awaited<ReturnType<typeof stripe.webhooks.constructEventAsync>>;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    logger.warn("webhook", `Assinatura inválida: ${err}`);
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const meta = session.metadata as {
        userId: string;
        tipo: "inscricao" | "pedido_loja" | "combinado";
        orderId?: string;
        incluirInscricao?: string;
      };

      if (!meta?.userId || !meta?.tipo) {
        logger.warn("webhook", "Metadata ausente na sessão Stripe");
        return NextResponse.json({ received: true });
      }

      if (meta.tipo === "inscricao") {
        const existing = await prisma.eventRegistration.findUnique({
          where: { userId: meta.userId },
          select: { paymentId: true, paymentStatus: true },
        });
        if (existing?.paymentId === session.id && existing.paymentStatus === "APPROVED") {
          return NextResponse.json({ received: true });
        }

        await prisma.eventRegistration.update({
          where: { userId: meta.userId },
          data: { paymentStatus: "APPROVED", paymentId: session.id },
        });

        await audit({
          actorType: "WEBHOOK",
          action: "REGISTRATION_PAYMENT_APPROVED",
          entityId: meta.userId,
          entityType: "EventRegistration",
          metadata: { sessionId: session.id },
        });

        const user = await prisma.user.findUnique({ where: { id: meta.userId } });
        if (user) await sendConfirmationEmail(user.email, user.name);
      }

      if (meta.tipo === "pedido_loja" && meta.orderId) {
        const existing = await prisma.order.findUnique({
          where: { id: meta.orderId },
          select: { paymentId: true, status: true },
        });
        if (existing?.paymentId === session.id && existing.status === "APPROVED") {
          return NextResponse.json({ received: true });
        }

        await prisma.order.update({
          where: { id: meta.orderId },
          data: { status: "APPROVED", paymentId: session.id },
        });

        await audit({
          actorType: "WEBHOOK",
          action: "ORDER_APPROVED",
          entityId: meta.orderId,
          entityType: "Order",
          metadata: { sessionId: session.id },
        });
      }

      if (meta.tipo === "combinado") {
        const incluirInscricao = meta.incluirInscricao === "true";
        const orderId = meta.orderId || null;

        await prisma.$transaction(async (tx) => {
          if (incluirInscricao) {
            await tx.eventRegistration.update({
              where: { userId: meta.userId },
              data: { paymentStatus: "APPROVED", paymentId: session.id },
            });
          }
          if (orderId) {
            await tx.order.update({
              where: { id: orderId },
              data: { status: "APPROVED", paymentId: session.id },
            });
          }
        });

        await audit({
          actorType: "WEBHOOK",
          action: "CHECKOUT_COMBINED_APPROVED",
          entityId: orderId ?? meta.userId,
          entityType: orderId ? "Order" : "EventRegistration",
          metadata: { sessionId: session.id, incluirInscricao, orderId },
        });

        if (incluirInscricao) {
          const user = await prisma.user.findUnique({ where: { id: meta.userId } });
          if (user) await sendConfirmationEmail(user.email, user.name);
        }
      }
    }

    // Sessão expirada — devolve estoque reservado dos pedidos da loja
    if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      const meta = session.metadata as { orderId?: string };

      if (meta?.orderId) {
        await prisma.$transaction(async (tx) => {
          await tx.order.update({
            where: { id: meta.orderId! },
            data: { status: "CANCELLED" },
          });
          const itens = await tx.orderItem.findMany({ where: { orderId: meta.orderId! } });
          for (const item of itens) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        });

        await audit({
          actorType: "WEBHOOK",
          action: "ORDER_CANCELLED",
          entityId: meta.orderId,
          entityType: "Order",
          metadata: { motivo: "sessao_stripe_expirada" },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("webhook", error);
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
