import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { sendConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { sendAdminAlert } from "@/lib/alert";

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

  // Idempotência: ignorar eventos já processados
  try {
    await prisma.processedStripeEvent.create({ data: { id: event.id } });
  } catch (err: any) {
    if (err?.code === "P2002") {
      // Unique constraint = evento duplicado, já processado
      return NextResponse.json({ received: true });
    }
    // Qualquer outro erro (ex: tabela não existe ainda) — loga mas continua processando
    // para não perder pagamentos reais
    logger.error("webhook idempotency", err);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Só processa se o pagamento foi realmente coletado
      if (session.payment_status !== "paid") {
        return NextResponse.json({ received: true });
      }

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

    // Estorno: atualiza status e notifica admin
    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;

      if (paymentIntentId) {
        const [reg, order] = await Promise.all([
          prisma.eventRegistration.findFirst({ where: { paymentId: { contains: paymentIntentId } } }),
          prisma.order.findFirst({ where: { paymentId: { contains: paymentIntentId } } }),
        ]);

        if (reg) {
          await prisma.eventRegistration.update({
            where: { id: reg.id },
            data: { paymentStatus: "REFUNDED" },
          });
          await audit({
            actorType: "WEBHOOK",
            action: "REGISTRATION_REFUNDED",
            entityId: reg.id,
            entityType: "EventRegistration",
            metadata: { chargeId: charge.id, paymentIntentId },
          });
        }

        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "REFUNDED" },
          });
          await audit({
            actorType: "WEBHOOK",
            action: "ORDER_REFUNDED",
            entityId: order.id,
            entityType: "Order",
            metadata: { chargeId: charge.id, paymentIntentId },
          });
        }

        await sendAdminAlert(
          "Estorno processado",
          `PaymentIntent: ${paymentIntentId}\nCharge: ${charge.id}\nValor: R$ ${(charge.amount_refunded / 100).toFixed(2)}`,
          "AVISO"
        );
      }
    }

    // Disputa/chargeback: notifica admin urgente
    if (event.type === "charge.dispute.created") {
      const dispute = event.data.object;
      const chargeId = typeof dispute.charge === "string" ? dispute.charge : "";

      await audit({
        actorType: "WEBHOOK",
        action: "CHARGE_DISPUTE_CREATED",
        entityId: chargeId,
        entityType: "Charge",
        metadata: { disputeId: dispute.id, amount: dispute.amount, reason: dispute.reason },
      });

      await sendAdminAlert(
        "DISPUTA (chargeback) aberta",
        `Dispute ID: ${dispute.id}\nCharge: ${chargeId}\nValor: R$ ${(dispute.amount / 100).toFixed(2)}\nMotivo: ${dispute.reason}\n\nAcesse o Stripe Dashboard imediatamente.`,
        "ERRO"
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("webhook", error);
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
