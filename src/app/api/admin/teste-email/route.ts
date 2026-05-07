import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logger } from "@/lib/logger";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

// POST /api/admin/teste-email — envia um e-mail de teste para o admin diagnosticar a configuração SMTP
export async function POST(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.type !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

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

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: session.user.email,
      subject: "[SAUU] Teste de e-mail — configuração OK",
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto">
          <h2>Teste de e-mail</h2>
          <p>Este e-mail confirma que o envio de e-mails está funcionando corretamente.</p>
          <hr/>
          <p style="color:#888;font-size:12px">
            Enviado em: ${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}<br/>
            Host SMTP: ${process.env.EMAIL_HOST}:${process.env.EMAIL_PORT}<br/>
            Remetente: ${process.env.EMAIL_FROM}
          </p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true, message: `E-mail enviado para ${session.user.email}` });
  } catch (err) {
    logger.error("POST /api/admin/teste-email", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
