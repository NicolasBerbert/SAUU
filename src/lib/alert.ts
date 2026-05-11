import { logger } from "@/lib/logger";

export type AlertSeverity = "AVISO" | "ERRO" | "CRITICO";

export async function sendAdminAlert(
  assunto: string,
  corpo: string,
  severidade: AlertSeverity = "ERRO"
): Promise<void> {
  const destino = process.env.ADMIN_ALERT_EMAIL;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "SAUU CLBB <noreply@clbbsauu.com>";

  if (!destino || !apiKey) {
    logger.warn("alert", `[${severidade}] ${assunto} — ADMIN_ALERT_EMAIL ou RESEND_API_KEY não configurado`);
    return;
  }

  const icone = severidade === "CRITICO" ? "🔴" : severidade === "ERRO" ? "🟠" : "🟡";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: destino,
        subject: `${icone} [SAUU ${severidade}] ${assunto}`,
        html: `
          <div style="font-family:monospace;max-width:700px;margin:0 auto;border:2px solid #c0392b;border-radius:4px;padding:24px;">
            <h2 style="color:#c0392b;margin-top:0;">${icone} Alerta do Sistema SAUU</h2>
            <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
              <tr><td style="padding:4px 8px;font-weight:bold;width:120px;">Severidade</td><td style="padding:4px 8px;">${severidade}</td></tr>
              <tr style="background:#f8f8f8;"><td style="padding:4px 8px;font-weight:bold;">Assunto</td><td style="padding:4px 8px;">${assunto}</td></tr>
              <tr><td style="padding:4px 8px;font-weight:bold;">Momento</td><td style="padding:4px 8px;">${new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td></tr>
            </table>
            <div style="background:#1a1a2e;color:#e0e0e0;padding:16px;border-radius:4px;white-space:pre-wrap;font-size:13px;">${corpo}</div>
            <hr style="margin:16px 0;border-color:#ddd;" />
            <p style="color:#888;font-size:12px;margin:0;">
              Alerta automático do sistema SAUU CLBB.<br/>
              Painel: <a href="${process.env.NEXTAUTH_URL ?? "#"}/admin">${process.env.NEXTAUTH_URL ?? ""}/admin</a>
            </p>
          </div>
        `,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      logger.error("alert", `Resend error ${res.status}: ${body}`);
    } else {
      logger.info("alert", `Alerta enviado para ${destino}: [${severidade}] ${assunto}`);
    }
  } catch (err) {
    logger.error("alert", `Falha ao enviar alerta: ${err}`);
  }
}
