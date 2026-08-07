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
  const link = `${baseUrl}/api/auth/verificar-email?token=${token}`;

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

export async function sendOrderConfirmationEmail(
  to: string,
  name: string,
  items: Array<{ name: string; quantity: number; size?: string | null; price: number }>,
  total: number
): Promise<void> {
  const rows = items
    .map((i) => {
      const tam = i.size ? ` (Tam ${i.size})` : "";
      return `<tr>
        <td style="padding:6px 0;color:#333;">${i.quantity}× ${i.name}${tam}</td>
        <td style="padding:6px 0;text-align:right;color:#333;">R$ ${(i.price * i.quantity).toFixed(2)}</td>
      </tr>`;
    })
    .join("");

  await sendEmail(
    to,
    "Pedido confirmado - SAUU Unifil",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a2e;">Pedido confirmado!</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos o pagamento do seu pedido na loja da SAUU. Segue o resumo:</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
          ${rows}
          <tr>
            <td style="padding:10px 0;border-top:1px solid #ddd;font-weight:bold;">Total</td>
            <td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold;">R$ ${total.toFixed(2)}</td>
          </tr>
        </table>
        <p>A retirada dos produtos será combinada durante o evento.</p>
        <hr />
        <p style="color:#888;font-size:12px;">SAUU + SEC &mdash; Unifil</p>
      </div>
    `
  );
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/redefinir-senha?token=${token}`;

  await sendEmail(
    to,
    "Redefinição de senha - SAUU Unifil",
    `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h1 style="color:#1a1a2e;">Redefinir senha</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Recebemos um pedido para redefinir a senha da sua conta na SAUU. Clique no botão abaixo para escolher uma nova senha.</p>
        <p style="margin:32px 0;">
          <a href="${link}" style="background:#c8a96e;color:#0a0a14;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:2px;">
            Redefinir senha
          </a>
        </p>
        <p style="color:#888;font-size:12px;">Este link expira em 1 hora. Se você não pediu a redefinição, ignore este e-mail — sua senha continua a mesma.</p>
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
  const link = `${baseUrl}/api/auth/verificar-email?token=${token}`;

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
