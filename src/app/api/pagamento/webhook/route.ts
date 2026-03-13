import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";
import { mpPayment } from "@/lib/mercadopago";
import { sendConfirmationEmail } from "@/lib/email";

// Valida a assinatura do Mercado Pago usando HMAC-SHA256.
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
function verifyMpSignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[WEBHOOK] MP_WEBHOOK_SECRET não configurado");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  if (!xSignature || !xRequestId) return false;

  // Extrai ts e v1 do header x-signature (formato: "ts=...,v1=...")
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => part.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // O template assinado pelo MP é: "id:{data.id};request-id:{x-request-id};ts:{ts};"
  // data.id vem do body
  let dataId: string;
  try {
    dataId = String(JSON.parse(rawBody)?.data?.id ?? "");
  } catch {
    return false;
  }

  const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret)
    .update(signedTemplate)
    .digest("hex");

  // Comparação em tempo constante para evitar timing attacks
  try {
    return timingSafeEqual(
      Buffer.from(v1, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  // Lê o body como texto para validar a assinatura antes de parsear
  const rawBody = await req.text();

  if (!verifyMpSignature(req, rawBody)) {
    console.warn("[WEBHOOK] Assinatura inválida rejeitada");
    return NextResponse.json({ error: "Assinatura inválida" }, { status: 401 });
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
      type: "event_registration" | "shop_order";
      orderId?: string;
    };

    const status =
      paymentInfo.status === "approved" ? "APPROVED"
      : paymentInfo.status === "rejected" ? "REJECTED"
      : paymentInfo.status === "cancelled" ? "CANCELLED"
      : "PENDING";

    if (metadata.type === "event_registration") {
      await prisma.eventRegistration.update({
        where: { userId: metadata.userId },
        data: { paymentStatus: status, paymentId },
      });

      if (status === "APPROVED") {
        const user = await prisma.user.findUnique({ where: { id: metadata.userId } });
        if (user) await sendConfirmationEmail(user.email, user.name);
      }
    }

    if (metadata.type === "shop_order" && metadata.orderId) {
      await prisma.order.update({
        where: { id: metadata.orderId },
        data: { status, paymentId },
      });

      if (status === "APPROVED") {
        const orderItems = await prisma.orderItem.findMany({
          where: { orderId: metadata.orderId },
        });
        for (const item of orderItems) {
          await prisma.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[WEBHOOK /api/pagamento/webhook]", error);
    return NextResponse.json({ error: "Erro no webhook" }, { status: 500 });
  }
}
