// Valida variáveis de ambiente obrigatórias no startup do servidor.
// Importado em instrumentation.ts para falhar ruidosamente se algo estiver faltando.

const required = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
] as const;

const requiredInProduction = [
  "MERCADOPAGO_ACCESS_TOKEN", // PIX — inscrições
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "EVENT_REGISTRATION_PRICE",
  "ADMIN_ALERT_EMAIL",
  // STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET (loja) ficam OPCIONAIS de
  // propósito: sem elas o site sobe normal e só o checkout da loja falha,
  // em vez de derrubar tudo no boot.
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
