import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { processarPagamentoMp } from "@/lib/mercadopago";
import { logger } from "@/lib/logger";

// Valida a assinatura x-signature do Mercado Pago (defesa extra).
// Só é exigida se MERCADOPAGO_WEBHOOK_SECRET estiver configurada — a
// segurança principal é a reconsulta autenticada do pagamento na API do MP.
function assinaturaValida(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret) return true; // sem secret: confia na reconsulta autenticada

  const signature = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k?.trim(), v?.trim()];
    })
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

// POST /api/pagamento/mercadopago/webhook
// O Mercado Pago envia notificações (topic=payment) com o id do pagamento.
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const queryType = url.searchParams.get("type") ?? url.searchParams.get("topic");
  const queryId = url.searchParams.get("data.id") ?? url.searchParams.get("id");

  let body: { type?: string; action?: string; data?: { id?: string | number } } | null = null;
  try {
    body = await req.json();
  } catch {
    body = null;
  }

  const type = body?.type ?? body?.action ?? queryType ?? "";
  const paymentId = body?.data?.id != null ? String(body.data.id) : queryId;

  // Só nos interessam notificações de pagamento
  if (type && !String(type).includes("payment")) {
    return NextResponse.json({ received: true });
  }
  if (!paymentId) {
    return NextResponse.json({ received: true });
  }

  if (!assinaturaValida(req, paymentId)) {
    logger.warn("mercadopago webhook", "Assinatura inválida");
    return NextResponse.json({ error: "assinatura inválida" }, { status: 401 });
  }

  try {
    await processarPagamentoMp(paymentId);
  } catch (err) {
    // Retorna 500 para o Mercado Pago reenviar a notificação depois.
    logger.error("mercadopago webhook", err);
    return NextResponse.json({ error: "erro ao processar" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
