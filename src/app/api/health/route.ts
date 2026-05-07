import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import nodemailer from "nodemailer";

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
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: process.env.EMAIL_SECURE === "true",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function checkStripe(): Promise<{ ok: boolean; mode?: string; error?: string }> {
  try {
    const key = process.env.STRIPE_SECRET_KEY ?? "";
    if (!key) return { ok: false, error: "STRIPE_SECRET_KEY não configurada" };
    const mode = key.startsWith("sk_live_") ? "live" : "test";
    // Lightweight check: just verify key format (no API call to avoid rate limits)
    return { ok: key.length > 20, mode };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

// GET /api/health — verificação de saúde detalhada
// Não requer autenticação. Retorna 200 se OK, 503 se degradado.
export async function GET() {
  const [db, email, stripe] = await Promise.all([
    checkDb(),
    checkEmail(),
    checkStripe(),
  ]);

  const allOk = db.ok && email.ok && stripe.ok;
  const ts = new Date().toISOString();

  const body = {
    status: allOk ? "ok" : "degraded",
    ts,
    checks: {
      db: {
        status: db.ok ? "ok" : "error",
        latencyMs: db.latencyMs,
      },
      email: {
        status: email.ok ? "ok" : "error",
        ...(email.error ? { error: email.error } : {}),
      },
      stripe: {
        status: stripe.ok ? "ok" : "error",
        mode: stripe.mode ?? "unknown",
        ...(stripe.error ? { error: stripe.error } : {}),
      },
    },
  };

  return NextResponse.json(body, { status: allOk ? 200 : 503 });
}
