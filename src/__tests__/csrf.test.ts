import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { verifyCsrf } from "@/lib/csrf";

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers,
  });
}

describe("verifyCsrf — ambiente de desenvolvimento", () => {
  beforeEach(() => {
    // Em development, a função sempre retorna true independente dos headers
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NEXTAUTH_URL", "https://sauu.unifil.br");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna true em NODE_ENV=development", () => {
    const req = makeRequest({}); // sem origin nem referer
    expect(verifyCsrf(req)).toBe(true);
  });
});

describe("verifyCsrf — produção", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "https://sauu.unifil.br");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("permite requisição com origin correto", () => {
    const req = makeRequest({ origin: "https://sauu.unifil.br" });
    expect(verifyCsrf(req)).toBe(true);
  });

  it("permite requisição com referer correto (sem origin)", () => {
    const req = makeRequest({ referer: "https://sauu.unifil.br/checkout" });
    expect(verifyCsrf(req)).toBe(true);
  });

  it("prefere origin sobre referer quando ambos presentes", () => {
    const req = makeRequest({
      origin: "https://sauu.unifil.br",
      referer: "https://atacante.com/pagina",
    });
    expect(verifyCsrf(req)).toBe(true);
  });

  it("bloqueia origin de domínio diferente", () => {
    const req = makeRequest({ origin: "https://atacante.com" });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("bloqueia referer de domínio diferente", () => {
    const req = makeRequest({ referer: "https://atacante.com/csrf" });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("bloqueia requisição sem origin e sem referer", () => {
    const req = makeRequest({});
    expect(verifyCsrf(req)).toBe(false);
  });

  it("bloqueia origin malformado", () => {
    const req = makeRequest({ origin: "nao-e-uma-url-valida" });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("bloqueia subdomínio não autorizado", () => {
    const req = makeRequest({ origin: "https://sub.sauu.unifil.br" });
    expect(verifyCsrf(req)).toBe(false);
  });

  it("bloqueia mesmo domínio com porta diferente", () => {
    const req = makeRequest({ origin: "https://sauu.unifil.br:8080" });
    expect(verifyCsrf(req)).toBe(false);
  });
});

describe("verifyCsrf — sem NEXTAUTH_URL configurado", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXTAUTH_URL", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("retorna true quando NEXTAUTH_URL não está definida (bypass seguro para setup incompleto)", () => {
    const req = makeRequest({});
    expect(verifyCsrf(req)).toBe(true);
  });
});
