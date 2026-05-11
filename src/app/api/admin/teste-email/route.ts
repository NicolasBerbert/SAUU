import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

// POST /api/admin/teste-email — envia e-mail de teste via Resend
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "SAUU CLBB <noreply@clbbsauu.com>";

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "RESEND_API_KEY não configurada" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: session.user.email,
        subject: "[SAUU CLBB] Teste de e-mail — configuração OK",
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
            <h2>Teste de e-mail</h2>
            <p>Este e-mail confirma que o envio via Resend está funcionando corretamente.</p>
            <hr/>
            <p style="color:#888;font-size:12px">
              Enviado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}<br/>
              Remetente: ${from}
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Resend ${res.status}: ${body}`);
    }

    return NextResponse.json({ ok: true, message: `E-mail enviado para ${session.user.email}` });
  } catch (err) {
    logger.error("POST /api/admin/teste-email", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
