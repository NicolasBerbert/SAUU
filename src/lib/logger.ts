// Logger estruturado — serializa JSON para facilitar grep e integração futura com Sentry.
// Nunca inclui dados pessoais (email, senha, CPF) nas mensagens.

type Level = "info" | "warn" | "error";

function log(level: Level, context: string, message: unknown) {
  const entry = JSON.stringify({
    level,
    context,
    message: message instanceof Error
      ? { name: message.name, msg: message.message }
      : message,
    ts: new Date().toISOString(),
  });

  if (level === "error") {
    console.error(entry);
  } else if (level === "warn") {
    console.warn(entry);
  } else {
    console.log(entry);
  }
}

export const logger = {
  info: (context: string, message: unknown) => log("info", context, message),
  warn: (context: string, message: unknown) => log("warn", context, message),
  error: (context: string, message: unknown) => log("error", context, message),
};
