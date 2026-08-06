import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { processarPagamentoMp } from "@/lib/mercadopago";

// GET /api/pagamento/status?pid=<id>
// Consultado pela tela do PIX (polling). Processa o pagamento de forma
// idempotente (só marca APPROVED se o MP confirmar) e devolve se foi aprovado.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const pid = new URL(req.url).searchParams.get("pid");
  if (!pid) return NextResponse.json({ error: "pid ausente" }, { status: 400 });

  try {
    const { approved } = await processarPagamentoMp(pid);
    return NextResponse.json({ approved });
  } catch {
    return NextResponse.json({ approved: false });
  }
}
