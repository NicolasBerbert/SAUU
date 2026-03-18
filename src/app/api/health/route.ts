import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/health — verificação de saúde para monitoramento externo (UptimeRobot, etc.)
// Não requer autenticação. Retorna 200 se OK, 503 se o banco estiver inacessível.
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ok", db: "ok", ts: new Date().toISOString() },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "error", ts: new Date().toISOString() },
      { status: 503 }
    );
  }
}
