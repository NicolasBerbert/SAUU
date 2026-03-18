import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

// Envia um alerta por email para o administrador do sistema.
// Nunca lança exceção — falhas são logadas mas não interrompem o fluxo.
// Usa as mesmas credenciais SMTP configuradas para emails de usuário.

export type AlertSeverity = "AVISO" | "ERRO" | "CRITICO";

export async function sendAdminAlert(
  assunto: string,
  corpo: string,
  severidade: AlertSeverity = "ERRO"
): Promise<void> {
  const destino = process.env.ADMIN_ALERT_EMAIL;
  if (!destino) {
    // Em desenvolvimento ou se não configurado, apenas loga
    logger.warn("alert", `[${severidade}] ${assunto} — ADMIN_ALERT_EMAIL não configurado`);
    return;
  }

  // Não enviar alertas se o serviço de email não estiver configurado
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    logger.warn("alert", `[${severidade}] ${assunto} — EMAIL_HOST/EMAIL_USER não configurados`);
    return;
  }

  const icone =
    severidade === "CRITICO" ? "🔴" : severidade === "ERRO" ? "🟠" : "🟡";

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

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: destino,
      subject: `${icone} [SAUU ${severidade}] ${assunto}`,
      html: `
        <div style="font-family: monospace; max-width: 700px; margin: 0 auto; border: 2px solid #c0392b; border-radius: 4px; padding: 24px;">
          <h2 style="color: #c0392b; margin-top: 0;">${icone} Alerta do Sistema SAUU</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
            <tr>
              <td style="padding: 4px 8px; font-weight: bold; width: 120px;">Severidade</td>
              <td style="padding: 4px 8px;">${severidade}</td>
            </tr>
            <tr style="background: #f8f8f8;">
              <td style="padding: 4px 8px; font-weight: bold;">Assunto</td>
              <td style="padding: 4px 8px;">${assunto}</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px; font-weight: bold;">Momento</td>
              <td style="padding: 4px 8px;">${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td>
            </tr>
          </table>
          <div style="background: #1a1a2e; color: #e0e0e0; padding: 16px; border-radius: 4px; white-space: pre-wrap; font-size: 13px;">${corpo}</div>
          <hr style="margin: 16px 0; border-color: #ddd;" />
          <p style="color: #888; font-size: 12px; margin: 0;">
            Este é um alerta automático do sistema SAUU Unifil.<br/>
            Acesse o painel em <a href="${process.env.NEXTAUTH_URL ?? "#"}/admin">${process.env.NEXTAUTH_URL ?? ""}/admin</a>
          </p>
        </div>
      `,
    });

    logger.info("alert", `Alerta enviado para ${destino}: [${severidade}] ${assunto}`);
  } catch (err) {
    // Nunca deixar falha de alerta derrubar o fluxo principal
    logger.error("alert", `Falha ao enviar alerta: ${err}`);
  }
}
