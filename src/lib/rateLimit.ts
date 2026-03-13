// Rate limiter em memória com janela deslizante.
// Funciona por instância do processo — adequado para o PM2 cluster de 2 instâncias
// em um evento de ~200 usuários. Para escala maior, substituir por Redis.

interface Window {
  count: number;
  resetAt: number;
}

const store = new Map<string, Window>();

// Limpa entradas expiradas a cada 5 minutos para evitar memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, win] of store.entries()) {
    if (now > win.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  /** Janela de tempo em segundos */
  windowSec: number;
  /** Máximo de requisições na janela */
  max: number;
}

/**
 * Verifica e incrementa o contador para uma chave.
 * Retorna `{ allowed: true }` ou `{ allowed: false, retryAfterSec: number }`.
 */
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

/** Extrai o IP real da requisição, considerando proxy reverso (Nginx). */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
