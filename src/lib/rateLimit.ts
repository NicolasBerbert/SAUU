// Rate limiter em memória com janela deslizante.
// Fornece proteção básica por invocação em ambientes serverless (Vercel).
// Para limites globais entre múltiplas instâncias, usar Upstash Redis.

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

export interface RateLimitConfig {
  windowSec: number;
  max: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const now = Date.now();
  const win = store.get(key);

  if (!win || now > win.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 });
    return { allowed: true };
  }

  if (win.count >= config.max) {
    const retryAfterSec = Math.ceil((win.resetAt - now) / 1000);
    return { allowed: false, retryAfterSec };
  }

  win.count++;
  return { allowed: true };
}

// Extrai o IP real da requisição.
// Vercel injeta x-forwarded-for automaticamente.
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
