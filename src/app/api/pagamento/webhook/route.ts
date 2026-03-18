import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { mpPayment } from "@/lib/mercadopago";
import { sendConfirmationEmail } from "@/lib/email";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { sendAdminAlert } from "@/lib/alert";
import { verifyMpSignature, WEBHOOK_TIMESTAMP_TOLERANCE_SEC } from "@/lib/webhookSignature";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  const { valid, ts } = verifyMpSignature(
    {
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
    },
    rawBody,
    process.env.MP_WEBHOOK_SECRET
  );
  if (!valid) {
    logger.warn("webhook", "Assinatura inválida rejeitada");
    // Registra no AuditLog para que /api/admin/monitorar possa detectar padrões
    await audit({
      actorType: "WEBHOOK",
      action: "WEBHOOK_SIGNATURE_INVALID",
      metadata: { corpo: rawBody.slice(0, 200) },
    });
    await sendAdminAlert(
      "Webhook MP com assinatura inválida",
      `Uma requisição com assinatura inválida chegou no webhook.\nCorpo (primeiros 500 chars): ${rawBody.slice(0, 500)}`,
      "AVISO"
    );
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
  }

  // Validação de frescor do timestamp — rejeita webhooks com mais de 5 minutos
  if (ts !== undefined) {
    const ageSeconds = Math.floor(Date.now() / 1000) - ts;
    if (ageSeconds > WEBHOOK_TIMESTAMP_TOLERANCE_SEC) {
      logger.warn("webhook", `Webhook expirado (${ageSeconds}s atrás)`);
      return NextResponse.json({ error: "Webhook expirado" }, { status: 401 });
    }
  }

  try {
    const body = JSON.parse(rawBody);

    if (body.type !== "payment") {
      return NextResponse.json({ received: true });
    }

    const paymentId = String(body.data.id);
    const paymentInfo = await mpPayment.get({ id: paymentId });

    const metadata = paymentInfo.metadata as {
      userId: string;
      type: "event_registration" | "shop_order" | "checkout_combined";
      orderId?: string | null;
      includesRegistration?: boolean;
    };

    const status =
      paymentInfo.status === "approved" ? "APPROVED"
      : paymentInfo.status === "rejected" ? "REJECTED"
      : paymentInfo.status === "cancelled" ? "CANCELLED"
      : paymentInfo.status === "refunded" || paymentInfo.status === "charged_back" ? "REFUNDED"
      : "PENDING";

    if (metadata.type === "event_registration") {
      // Idempotência — não reprocessar se já estiver no estado final
      const existing = await prisma.eventRegistration.findUnique({
        where: { userId: metadata.userId },
        select: { paymentStatus: true, paymentId: true },
      });

      if (existing?.paymentId === paymentId && existing.paymentStatus === status) {
        logger.info("webhook", `event_registration já processado: ${paymentId}`);
        return NextResponse.json({ received: true });
      }

      await prisma.eventRegistration.update({
        where: { userId: metadata.userId },
        data: { paymentStatus: status, paymentId },
      });

      await audit({
        actorType: "WEBHOOK",
        action: `REGISTRATION_PAYMENT_${status}`,
        entityId: metadata.userId,
        entityType: "EventRegistration",
        metadata: { paymentId, mpStatus: paymentInfo.status },
      });

      if (status === "APPROVED") {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
        if (user) await sendConfirmationEmail(user.email, user.name);
      }
    }

    if (metadata.type === "shop_order" && metadata.orderId) {
      // Idempotência — não reprocessar se já estiver no estado final
      const existing = await prisma.order.findUnique({
        where: { id: metadata.orderId },
        select: { status: true, paymentId: true },
      });

      if (existing?.paymentId === paymentId && existing.status === status) {
        logger.info("webhook", `shop_order já processado: ${paymentId}`);
        return NextResponse.json({ received: true });
      }

      // Processar em transação atômica
      await prisma.$transaction(async (tx) => {
        await tx.order.update({
          where: { id: metadata.orderId! },
          data: { status: status as "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" | "REFUNDED", paymentId },
        });

        if (status === "REJECTED" || status === "CANCELLED" || status === "REFUNDED") {
          // Devolver estoque reservado na criação do pedido
          const orderItems = await tx.orderItem.findMany({
            where: { orderId: metadata.orderId! },
          });
          for (const item of orderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }
      });

      await audit({
        actorType: "WEBHOOK",
        action: `ORDER_${status}`,
        entityId: metadata.orderId,
        entityType: "Order",
        metadata: { paymentId, mpStatus: paymentInfo.status },
      });
    }

    // ── Checkout unificado: inscrição + loja em um único pagamento ──────────
    if (metadata.type === "checkout_combined") {
      // Idempotência: verifica se qualquer um dos registros já foi processado
      const registrationProcessada = metadata.includesRegistration
        ? await prisma.eventRegistration.findUnique({
            where: { userId: metadata.userId },
            select: { paymentStatus: true, paymentId: true },
          })
        : null;

      const pedidoProcessado = metadata.orderId
        ? await prisma.order.findUnique({
            where: { id: metadata.orderId },
            select: { status: true, paymentId: true },
          })
        : null;

      const jaProcessado =
        (registrationProcessada?.paymentId === paymentId && registrationProcessada.paymentStatus === status) &&
        (!metadata.orderId || (pedidoProcessado?.paymentId === paymentId && pedidoProcessado.status === status));

      if (jaProcessado) {
        logger.info("webhook", `checkout_combined já processado: ${paymentId}`);
        return NextResponse.json({ received: true });
      }

      // Atualiza inscrição e pedido atomicamente
      await prisma.$transaction(async (tx) => {
        if (metadata.includesRegistration) {
          await tx.eventRegistration.update({
            where: { userId: metadata.userId },
            data: { paymentStatus: status, paymentId },
          });
        }

        if (metadata.orderId) {
          await tx.order.update({
            where: { id: metadata.orderId },
            data: { status: status as "APPROVED" | "REJECTED" | "CANCELLED" | "PENDING" | "REFUNDED", paymentId },
          });

          // Devolve estoque se pagamento não aprovado
          if (status === "REJECTED" || status === "CANCELLED" || status === "REFUNDED") {
            const orderItems = await tx.orderItem.findMany({
              where: { orderId: metadata.orderId! },
            });
            for (const item of orderItems) {
              await tx.product.update({
                where: { id: item.productId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      });

      await audit({
        actorType: "WEBHOOK",
        action: `CHECKOUT_COMBINED_${status}`,
        entityId: metadata.orderId ?? metadata.userId,
        entityType: metadata.orderId ? "Order" : "EventRegistration",
        metadata: {
          paymentId,
          mpStatus: paymentInfo.status,
          includesRegistration: metadata.includesRegistration,
          orderId: metadata.orderId,
        },
      });

      // Email de confirmação da inscrição se aprovada
      if (status === "APPROVED" && metadata.includesRegistration) {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
        if (user) await sendConfirmationEmail(user.email, user.name);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("webhook", error);
    await sendAdminAlert(
      "Erro crítico no webhook do Mercado Pago",
      `O webhook falhou ao processar uma notificação de pagamento.\n\nErro: ${error instanceof Error ? error.message : String(error)}\n\nCorpo recebido (primeiros 500 chars):\n${rawBody.slice(0, 500)}`,
      "CRITICO"
    );
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
