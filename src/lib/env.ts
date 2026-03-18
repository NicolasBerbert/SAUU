// Valida variáveis de ambiente obrigatórias no startup do servidor.
// Importar em instrumentation.ts para falhar ruidosamente se algo estiver faltando.

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const requiredInProduction = [
  "MP_ACCESS_TOKEN",
  "MP_PUBLIC_KEY",
  "MP_WEBHOOK_SECRET",
  "EMAIL_HOST",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EVENT_REGISTRATION_PRICE",
  // Alertas de sistema — email do admin para receber notificações críticas
  "ADMIN_ALERT_EMAIL",
  // Token usado pelo cron de limpeza de pedidos PENDING (PM2 ou UptimeRobot)
  "CLEANUP_SERVICE_TOKEN",
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of required) {
    if (!process.env[key]) missing.push(key);
  }

  if (process.env.NODE_ENV === "production") {
    for (const key of requiredInProduction) {
      if (!process.env[key]) missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[env] Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}\n` +
      "Verifique o arquivo .env e o .env.example."
    );
  }
}
