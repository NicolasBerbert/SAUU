import { createHash } from "crypto";
import { logger } from "@/lib/logger";

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_ADDRESS = process.env.EMAIL_FROM ?? "SAUU Unifil <noreply@sauunifil.com.br>";

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY não configurada");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_ADDRESS, to, subject, html }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/verificar-email?token=${token}`;

  await sendEmail(
    to,
    "Confirme seu e-mail - SAUU Unifil",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a2e;">Confirme seu e-mail</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Clique no botão abaixo para confirmar seu e-mail e ativar sua conta na SAUU.</p>
        <p style="margin:32px 0;">
          <a href="${link}" style="background:#c8a96e;color:#0a0a14;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:2px;">
            Confirmar e-mail
          </a>
        </p>
        <p style="color:#888;font-size:12px;">Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.</p>
        <hr />
        <p style="color:#888;font-size:12px;">SAUU + SEC &mdash; Unifil</p>
      </div>
    `
  );
}

export async function sendConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  await sendEmail(
    to,
    "Inscrição confirmada - SAUU Unifil",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a2e;">Inscrição Confirmada!</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Sua inscrição na <strong>SAUU + SEC</strong> foi confirmada com sucesso.</p>
        <p>Acesse o site para escolher as palestras que deseja assistir.</p>
        <hr />
        <p style="color:#888;font-size:12px;">SAUU + SEC &mdash; Unifil</p>
      </div>
    `
  );
}

export async function sendPresentationConfirmationEmail(
  to: string,
  name: string,
  presentations: Array<{ title: string; day: number; slot: string }>
): Promise<void> {
  const listHtml = presentations
    .map((p) => `<li><strong>Dia ${p.day} - ${p.slot}</strong>: ${p.title}</li>`)
    .join("");

  await sendEmail(
    to,
    "Suas palestras selecionadas - SAUU Unifil",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a2e;">Palestras Confirmadas!</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Você está inscrito nas seguintes palestras:</p>
        <ul>${listHtml}</ul>
        <p>Nos vemos no evento!</p>
        <hr />
        <p style="color:#888;font-size:12px;">SAUU + SEC &mdash; Unifil</p>
      </div>
    `
  );
}

export async function sendAdminVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/verificar-email?token=${token}`;

  try {
    await sendEmail(
      to,
      "Novo link de verificação - SAUU Unifil",
      `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
          <h1 style="color:#1a1a2e;">Novo link de verificação</h1>
          <p>Olá, <strong>${name}</strong>!</p>
          <p>Um administrador solicitou o reenvio do link de verificação do seu e-mail.</p>
          <p style="margin:32px 0;">
            <a href="${link}" style="background:#c8a96e;color:#0a0a14;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:2px;">
              Confirmar e-mail
            </a>
          </p>
          <p style="color:#888;font-size:12px;">Este link expira em 24 horas.</p>
          <hr />
          <p style="color:#888;font-size:12px;">SAUU + SEC &mdash; Unifil</p>
        </div>
      `
    );
  } catch (err) {
    logger.error("sendAdminVerificationEmail", err);
    throw err;
  }
}
