import { describe, it, expect, vi, afterEach } from "vitest";
import { createHmac } from "crypto";

// Mock do logger para não poluir saída dos testes
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}));

import { verifyMpSignature, WEBHOOK_TIMESTAMP_TOLERANCE_SEC } from "@/lib/webhookSignature";

afterEach(() => vi.restoreAllMocks());

// ─── Helpers ─────────────────────────────────────────────────────────────

const SECRET = "segredo-de-teste";
const REQUEST_ID = "req-123";

function buildSignature(dataId: string, ts: number, secret: string): string {
  const template = `id:${dataId};request-id:${REQUEST_ID};ts:${ts};`;
  const hash = createHmac("sha256", secret).update(template).digest("hex");
  return `ts=${ts},v1=${hash}`;
}

function buildBody(dataId: string): string {
  return JSON.stringify({ data: { id: dataId }, type: "payment" });
}

// ─── Testes ───────────────────────────────────────────────────────────────

describe("verifyMpSignature — assinatura válida", () => {
  it("valida assinatura correta", () => {
    const ts = Math.floor(Date.now() / 1000);
    const dataId = "pay_001";
    const body = buildBody(dataId);
    const sig = buildSignature(dataId, ts, SECRET);

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      body,
      SECRET
    );
    expect(resultado.valid).toBe(true);
    expect(resultado.ts).toBe(ts);
  });
});

describe("verifyMpSignature — falhas de segurança", () => {
  it("rejeita quando secret não está configurado", () => {
    const ts = Math.floor(Date.now() / 1000);
    const body = buildBody("pay_002");
    const sig = buildSignature("pay_002", ts, SECRET);

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      body,
      undefined // secret ausente
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita quando x-signature está ausente", () => {
    const resultado = verifyMpSignature(
      { xSignature: null, xRequestId: REQUEST_ID },
      buildBody("pay_003"),
      SECRET
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita quando x-request-id está ausente", () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = buildSignature("pay_004", ts, SECRET);

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: null },
      buildBody("pay_004"),
      SECRET
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita corpo adulterado (dataId diferente)", () => {
    const ts = Math.floor(Date.now() / 1000);
    // Assina com pay_005 mas envia corpo com pay_999
    const sig = buildSignature("pay_005", ts, SECRET);
    const bodyAdulterado = buildBody("pay_999");

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      bodyAdulterado,
      SECRET
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita secret errado", () => {
    const ts = Math.floor(Date.now() / 1000);
    const dataId = "pay_006";
    const sig = buildSignature(dataId, ts, "secret-errado");

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      buildBody(dataId),
      SECRET // secret correto, mas assinatura foi feita com outro
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita header x-signature malformado (sem v1)", () => {
    const resultado = verifyMpSignature(
      { xSignature: "ts=12345", xRequestId: REQUEST_ID }, // falta v1=
      buildBody("pay_007"),
      SECRET
    );
    expect(resultado.valid).toBe(false);
  });

  it("rejeita corpo JSON inválido", () => {
    const ts = Math.floor(Date.now() / 1000);
    const sig = `ts=${ts},v1=aabbcc`;

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      "{ json inválido >>>",
      SECRET
    );
    expect(resultado.valid).toBe(false);
  });
});

describe("verifyMpSignature — proteção anti-replay (timestamp)", () => {
  it("retorna ts correto para validação de frescor posterior", () => {
    const ts = Math.floor(Date.now() / 1000) - 60; // 1 minuto atrás
    const dataId = "pay_008";
    const sig = buildSignature(dataId, ts, SECRET);

    const resultado = verifyMpSignature(
      { xSignature: sig, xRequestId: REQUEST_ID },
      buildBody(dataId),
      SECRET
    );
    // Assinatura válida — quem valida frescor é o chamador
    expect(resultado.valid).toBe(true);
    expect(resultado.ts).toBe(ts);
  });

  it("a constante de tolerância é 300 segundos (5 minutos)", () => {
    // Garante que ninguém altere acidentalmente o limiar sem perceber
    expect(WEBHOOK_TIMESTAMP_TOLERANCE_SEC).toBe(300);
  });
});
