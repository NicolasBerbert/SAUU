import nodemailer from "nodemailer";
import { createHash } from "crypto";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const link = `${baseUrl}/verificar-email?token=${token}`;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Confirme seu e-mail - SAUU Unifil",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Confirme seu e-mail</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Clique no botão abaixo para confirmar seu e-mail e ativar sua conta na SAUU.</p>
        <p style="margin: 32px 0;">
          <a href="${link}" style="background:#c8a96e;color:#0a0a14;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:2px;">
            Confirmar e-mail
          </a>
        </p>
        <p style="color: #888; font-size: 12px;">Este link expira em 24 horas. Se você não criou uma conta, ignore este e-mail.</p>
        <hr />
        <p style="color: #888; font-size: 12px;">Semana de Arquitetura Unifil &mdash; Unifil</p>
      </div>
    `,
  });
}

export async function sendConfirmationEmail(
  to: string,
  name: string
): Promise<void> {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Inscrição confirmada - SAUU Unifil",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Inscrição Confirmada!</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Sua inscrição na <strong>Semana de Arquitetura Unifil (SAUU)</strong> foi confirmada com sucesso.</p>
        <p>Acesse o site para escolher as palestras que deseja assistir.</p>
        <hr />
        <p style="color: #888; font-size: 12px;">
          Semana de Arquitetura Unifil &mdash; Unifil
        </p>
      </div>
    `,
  });
}

export async function sendPresentationConfirmationEmail(
  to: string,
  name: string,
  presentations: Array<{ title: string; day: number; slot: string }>
): Promise<void> {
  const listHtml = presentations
    .map(
      (p) =>
        `<li><strong>Dia ${p.day} - ${p.slot === "SLOT_19H00" ? "19h00" : "20h45"}</strong>: ${p.title}</li>`
    )
    .join("");

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: "Suas palestras selecionadas - SAUU Unifil",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #1a1a2e;">Palestras Confirmadas!</h1>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Você está inscrito nas seguintes palestras:</p>
        <ul>${listHtml}</ul>
        <p>Nos vemos no evento!</p>
        <hr />
        <p style="color: #888; font-size: 12px;">
          Semana de Arquitetura Unifil &mdash; Unifil
        </p>
      </div>
    `,
  });
}
