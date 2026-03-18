import { describe, it, expect } from "vitest";
import { hashToken } from "@/lib/email";

// hashToken não precisa de SMTP — é uma função criptográfica pura
describe("hashToken", () => {
  it("retorna uma string hexadecimal de 64 caracteres (SHA-256)", () => {
    const hash = hashToken("token-de-teste");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it("é determinístico — mesmo input sempre produz mesmo output", () => {
    const token = "token-deterministico-123";
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it("inputs diferentes produzem hashes diferentes", () => {
    expect(hashToken("token-A")).not.toBe(hashToken("token-B"));
  });

  it("é sensível a maiúsculas/minúsculas", () => {
    expect(hashToken("Token")).not.toBe(hashToken("token"));
  });

  it("lida com token vazio sem lançar exceção", () => {
    expect(() => hashToken("")).not.toThrow();
    expect(hashToken("")).toHaveLength(64);
  });

  it("lida com token muito longo", () => {
    const tokenLongo = "a".repeat(10_000);
    expect(() => hashToken(tokenLongo)).not.toThrow();
    expect(hashToken(tokenLongo)).toHaveLength(64);
  });

  it("não vaza o token original no hash", () => {
    const token = "segredo-super-secreto";
    expect(hashToken(token)).not.toContain(token);
  });
});
