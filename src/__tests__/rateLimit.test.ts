import { describe, it, expect, beforeEach, vi } from "vitest";
import { checkRateLimit } from "@/lib/rateLimit";

// Isolamos o módulo a cada describe para ter um store limpo
// O store é um Map em memória no módulo — resetamos via re-import

describe("checkRateLimit", () => {
  beforeEach(() => {
    // Limpa o cache do módulo para resetar o Map interno entre testes
    vi.resetModules();
  });

  it("permite a primeira requisição", async () => {
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const result = rl("usuario:1", { windowSec: 60, max: 3 });
    expect(result.allowed).toBe(true);
  });

  it("permite requisições até o limite", async () => {
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 3 };
    const key = "usuario:limite";

    expect(rl(key, config).allowed).toBe(true);
    expect(rl(key, config).allowed).toBe(true);
    expect(rl(key, config).allowed).toBe(true);
  });

  it("bloqueia após atingir o limite", async () => {
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 3 };
    const key = "usuario:bloqueio";

    rl(key, config); // 1
    rl(key, config); // 2
    rl(key, config); // 3 — limite atingido

    const resultado = rl(key, config); // 4 — deve bloquear
    expect(resultado.allowed).toBe(false);
    if (!resultado.allowed) {
      expect(resultado.retryAfterSec).toBeGreaterThan(0);
      expect(resultado.retryAfterSec).toBeLessThanOrEqual(60);
    }
  });

  it("chaves diferentes são contadas separadamente", async () => {
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 1 };

    expect(rl("usuario:A", config).allowed).toBe(true);
    expect(rl("usuario:B", config).allowed).toBe(true); // chave diferente, não bloqueada
    expect(rl("usuario:A", config).allowed).toBe(false); // A está bloqueada
  });

  it("libera após a janela expirar", async () => {
    vi.useFakeTimers();
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const config = { windowSec: 10, max: 1 };
    const key = "usuario:expirar";

    rl(key, config); // usa o único slot
    expect(rl(key, config).allowed).toBe(false); // bloqueado

    // Avança 11 segundos — janela expirou
    vi.advanceTimersByTime(11_000);

    expect(rl(key, config).allowed).toBe(true); // liberado
    vi.useRealTimers();
  });

  it("retorna retryAfterSec correto", async () => {
    vi.useFakeTimers();
    const { checkRateLimit: rl } = await import("@/lib/rateLimit");
    const config = { windowSec: 30, max: 1 };
    const key = "usuario:retry";

    rl(key, config); // usa o slot

    // Avança 10 segundos — restam 20
    vi.advanceTimersByTime(10_000);

    const resultado = rl(key, config);
    expect(resultado.allowed).toBe(false);
    if (!resultado.allowed) {
      // retryAfterSec deve ser próximo de 20 (pode variar 1s por arredondamento)
      expect(resultado.retryAfterSec).toBeGreaterThanOrEqual(19);
      expect(resultado.retryAfterSec).toBeLessThanOrEqual(21);
    }
    vi.useRealTimers();
  });
});

describe("getClientIp", () => {
  it("retorna o primeiro IP do header x-forwarded-for", async () => {
    const { getClientIp } = await import("@/lib/rateLimit");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1" },
    });
    expect(getClientIp(req)).toBe("203.0.113.1");
  });

  it("retorna 'unknown' quando não há header de IP", async () => {
    const { getClientIp } = await import("@/lib/rateLimit");
    const req = new Request("http://localhost");
    expect(getClientIp(req)).toBe("unknown");
  });

  it("lida com IP único sem vírgula", async () => {
    const { getClientIp } = await import("@/lib/rateLimit");
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "192.168.1.100" },
    });
    expect(getClientIp(req)).toBe("192.168.1.100");
  });
});
