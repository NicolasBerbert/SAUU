// Valida variáveis de ambiente obrigatórias no startup do servidor.
// Importado em instrumentation.ts para falhar ruidosamente se algo estiver faltando.

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const requiredInProduction = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EVENT_REGISTRATION_PRICE",
  "ADMIN_ALERT_EMAIL",
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
      `[env] Variáveis de ambiente obrigatórias ausentes: ${missing.join(", ")}`
    );
  }
}
