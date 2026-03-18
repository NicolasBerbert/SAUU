/**
 * TOTP 2FA — funções auxiliares para autenticação de dois fatores (ADMIN)
 * Usa otplib v13 (RFC 6238) com tokens HMAC stateless para o fluxo de pending.
 */

import { generateSecret, generateSync, verifySync, generateURI } from "otplib";
import { createHmac, timingSafeEqual } from "crypto";

// ─── TOTP ─────────────────────────────────────────────────────────────────────

/** Gera um novo secret TOTP (base32). */
export function generateTotpSecret(): string {
  return generateSecret();
}

/** Verifica um código TOTP contra o secret do usuário. Aceita ±30s de drift. */
export function verifyTotpCode(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    // VerifyResult: { valid: boolean, delta: number, ... } ou { valid: false }
    return (result as { valid: boolean }).valid === true;
  } catch {
    return false;
  }
}

/** Retorna a URL otpauth:// para gerar o QR code. */
export function getTotpUri(email: string, secret: string): string {
  return generateURI({ secret, label: email, issuer: "SAUU Unifil" });
}

// ─── Pending token HMAC (stateless, funciona com PM2 dual-instance) ──────────

const PENDING_TOKEN_VERSION = "v1";
const PENDING_EXPIRY_SEC = 5 * 60; // 5 minutos para inserir o código

function getPendingSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET não configurado");
  return secret + ":totp-pending";
}

/**
 * Cria um token assinado com HMAC indicando que o usuário passou a verificação
 * de senha mas ainda não completou o 2FA. Expira em 5 minutos.
 */
export function createPendingToken(userId: string): string {
  const expiresAt = Math.floor(Date.now() / 1000) + PENDING_EXPIRY_SEC;
  const payload = `${PENDING_TOKEN_VERSION}:${userId}:${expiresAt}`;
  const sig = createHmac("sha256", getPendingSecret()).update(payload).digest("hex");
  return `${payload}:${sig}`;
}

/**
 * Verifica e decodifica um pending token.
 * Retorna `{ userId }` se válido, `null` caso contrário.
 */
export function verifyPendingToken(token: string): { userId: string } | null {
  try {
    const parts = token.split(":");
    if (parts.length !== 4) return null;
    const [version, userId, expiresAtStr, sig] = parts;
    if (version !== PENDING_TOKEN_VERSION) return null;

    const expiresAt = parseInt(expiresAtStr, 10);
    if (isNaN(expiresAt) || Math.floor(Date.now() / 1000) > expiresAt) return null;

    const payload = `${version}:${userId}:${expiresAtStr}`;
    const expected = createHmac("sha256", getPendingSecret()).update(payload).digest("hex");

    const sigBuf = Buffer.from(sig, "hex");
    const expectedBuf = Buffer.from(expected, "hex");
    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    return { userId };
  } catch {
    return null;
  }
}
