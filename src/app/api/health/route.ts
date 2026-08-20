import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

async function checkDb(): Promise<{ ok: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true, latencyMs: Date.now() - start };
  } catch {
    return { ok: false, latencyMs: -1 };
  }
}

async function checkEmail(): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY não configurada" };
  // Lightweight check — just verify the key is present and starts with re_
  return { ok: apiKey.startsWith("re_") };
}

async function checkMercadoPago(): Promise<{ ok: boolean; mode?: string; error?: string }> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
  if (!token) return { ok: false, error: "MERCADOPAGO_ACCESS_TOKEN não configurada" };
  // Tokens de produção começam com APP_USR-; de teste com TEST-.
  const mode = token.startsWith("TEST-") ? "test" : "live";
  return { ok: token.length > 20, mode };
}

async function checkStripe(): Promise<{ ok: boolean; mode?: string; error?: string }> {
  const key = process.env.STRIPE_SECRET_KEY ?? "";
  if (!key) return { ok: false, error: "STRIPE_SECRET_KEY não configurada" };
  const mode = key.startsWith("sk_live_") ? "live" : "test";
  return { ok: key.length > 20, mode };
}

// GET /api/health — verificação de saúde detalhada
export async function GET() {
  const [db, email, pagamento, stripe] = await Promise.all([
    checkDb(),
    checkEmail(),
    checkMercadoPago(),
    checkStripe(),
  ]);

  const allOk = db.ok && email.ok && pagamento.ok && stripe.ok;

  return NextResponse.json({
    status: allOk ? "ok" : "degraded",
    ts: new Date().toISOString(),
    checks: {
      db: { status: db.ok ? "ok" : "error", latencyMs: db.latencyMs },
      email: { status: email.ok ? "ok" : "error", ...(email.error ? { error: email.error } : {}) },
      mercadopago: { status: pagamento.ok ? "ok" : "error", mode: pagamento.mode ?? "unknown", ...(pagamento.error ? { error: pagamento.error } : {}) },
      stripe: { status: stripe.ok ? "ok" : "error", mode: stripe.mode ?? "unknown", ...(stripe.error ? { error: stripe.error } : {}) },
    },
  }, { status: allOk ? 200 : 503 });
}
