import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";

// GET /api/admin/cleanup — limpa tokens de verificação expirados
// Protegido por chave secreta; pode ser chamado por cron (Vercel Cron Jobs)
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const { count } = await prisma.emailVerificationToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });

    // Limpa também eventos Stripe processados com mais de 30 dias
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const { count: stripeCount } = await prisma.processedStripeEvent.deleteMany({
      where: { processedAt: { lt: thirtyDaysAgo } },
    });

    logger.info("cleanup", `Tokens expirados removidos: ${count}; Eventos Stripe: ${stripeCount}`);
    return NextResponse.json({ tokensRemoved: count, stripeEventsRemoved: stripeCount });
  } catch (err) {
    logger.error("cleanup", err);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}
