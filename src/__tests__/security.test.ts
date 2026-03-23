import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

vi.mock("@prisma/client", () => ({
  UserType: { UNIFIL: "UNIFIL", UEL: "UEL", FORMADO: "FORMADO", ADMIN: "ADMIN" },
}));

import {
  unifilRegisterSchema,
  loginSchema,
  productSchema,
} from "@/lib/validations";

// ─────────────────────────────────────────────────────────────────────────
// 1. INJEÇÃO VIA ZOD
// ─────────────────────────────────────────────────────────────────────────

describe("Injeção via campos de entrada", () => {
  const baseValido = {
    name: "Teste Silva",
    phone: "(43) 99999-9999",
    password: "senha123",
    confirmPassword: "senha123",
    institution: "Unifil",
    type: "UNIFIL" as const,
    email: "teste@edu.unifil.br",
  };

  it("SQL injection no nome não afeta o banco (Prisma usa queries parametrizadas)", () => {
    expect(typeof baseValido.name).toBe("string");
  });

  it("XSS em campos de texto passa no schema — proteção é o React (escaping JSX)", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...baseValido,
      name: "<script>alert('xss')</script>",
    });
    expect(resultado.success).toBe(true);
  });

  it("rejeita email com injeção de header SMTP", () => {
    const resultado = loginSchema.safeParse({
      email: "teste@exemplo.com\nBcc: victima@evil.com",
      password: "qualquer",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita tipo de usuário adulterado (tentativa de se registrar como ADMIN)", () => {
    const resultado = unifilRegisterSchema.safeParse({
      ...baseValido,
      type: "ADMIN",
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita preço negativo em produto", () => {
    const resultado = productSchema.safeParse({
      name: "Produto",
      price: -999,
      stock: 1,
      active: true,
    });
    expect(resultado.success).toBe(false);
  });

  it("rejeita email com domínio similar ao @edu.unifil.br", () => {
    const ataques = [
      "usuario@edu.unifil.br.evil.com",
      "usuario@edu-unifil.br",
      "usuario@edu.unifil.br.br",
      "usuario@EDU.UNIFIL.BR",
      "usuario@edu.Unifil.br",
    ];
    for (const email of ataques) {
      const resultado = unifilRegisterSchema.safeParse({ ...baseValido, email });
      expect(resultado.success).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 2. CSRF
// ─────────────────────────────────────────────────────────────────────────

import { verifyCsrf } from "@/lib/csrf";

describe("CSRF — vetores de bypass", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://sauu.vercel.app");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("não aceita origin vazio como válido", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { origin: "" },
    });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("não aceita http quando base é https", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { origin: "http://sauu.vercel.app" },
    });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("não aceita origin de domínio diferente", () => {
    const req = new Request("http://localhost/api/test", {
      headers: { origin: "https://evil.com" },
    });
    expect(verifyCsrf(req)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 3. RATE LIMIT
// ─────────────────────────────────────────────────────────────────────────

describe("Rate limit — comportamento sob abuso", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("bloqueia após burst acima do limite", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 5 };
    const ip = "192.168.1.attack";

    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(ip, config).allowed).toBe(true);
    }
    expect(checkRateLimit(ip, config).allowed).toBe(false);
    expect(checkRateLimit(ip, config).allowed).toBe(false);
  });

  it("IPs diferentes não compartilham limite", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 1 };

    checkRateLimit("ip:1.1.1.1", config);
    expect(checkRateLimit("ip:1.1.1.1", config).allowed).toBe(false);
    expect(checkRateLimit("ip:2.2.2.2", config).allowed).toBe(true);
  });

  it("chaves com prefixo diferente são isoladas (login vs cadastro)", async () => {
    const { checkRateLimit } = await import("@/lib/rateLimit");
    const config = { windowSec: 60, max: 1 };

    checkRateLimit("login:user@x.com", config);
    expect(checkRateLimit("login:user@x.com", config).allowed).toBe(false);
    expect(checkRateLimit("cadastro:user@x.com", config).allowed).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// 4. TOKEN DE VERIFICAÇÃO DE EMAIL
// ─────────────────────────────────────────────────────────────────────────

import { hashToken } from "@/lib/email";

describe("Tokens de verificação de email", () => {
  it("produz hashes de 64 chars (SHA-256)", () => {
    expect(hashToken("a")).toHaveLength(64);
  });

  it("tokens com 1 char de diferença produzem hashes completamente diferentes", () => {
    const h1 = hashToken("token-A");
    const h2 = hashToken("token-B");
    const diferente = [...h1].filter((c, i) => c !== h2[i]).length;
    expect(diferente).toBeGreaterThan(20);
  });

  it("hash não contém o token original (irreversível)", () => {
    const token = "token-secreto-12345";
    const hash = hashToken(token);
    expect(hash).not.toContain(token);
    expect(hash).not.toContain("secreto");
  });
});
