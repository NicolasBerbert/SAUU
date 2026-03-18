import { createHmac, timingSafeEqual } from "crypto";
import { logger } from "@/lib/logger";

export const WEBHOOK_TIMESTAMP_TOLERANCE_SEC = 300; // 5 minutos

// Valida a assinatura HMAC-SHA256 de um webhook do Mercado Pago.
// Documentação: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
export function verifyMpSignature(
  headers: { xSignature: string | null; xRequestId: string | null },
  rawBody: string,
  secret: string | undefined
): { valid: boolean; ts?: number } {
  if (!secret) {
    logger.error("webhook", "MP_WEBHOOK_SECRET não configurado");
    return { valid: false };
  }

  const { xSignature, xRequestId } = headers;
  if (!xSignature || !xRequestId) return { valid: false };

  // Extrai ts e v1 do header x-signature (formato: "ts=...,v1=...")
  const parts = Object.fromEntries(
    xSignature.split(",").map((part) => part.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return { valid: false };

  // O template assinado pelo MP é: "id:{data.id};request-id:{x-request-id};ts:{ts};"
  let dataId: string;
  try {
    dataId = String(JSON.parse(rawBody)?.data?.id ?? "");
  } catch {
    return { valid: false };
  }

  const signedTemplate = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret)
    .update(signedTemplate)
    .digest("hex");

  try {
    const isValid = timingSafeEqual(
      Buffer.from(v1, "hex"),
      Buffer.from(expectedHash, "hex")
    );
    return { valid: isValid, ts: Number(ts) };
  } catch {
    return { valid: false };
  }
}
