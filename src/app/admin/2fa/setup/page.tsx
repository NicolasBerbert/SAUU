"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { signOut } from "next-auth/react";

export default function AdminTotpSetupPage() {
  const [step, setStep] = useState<"idle" | "scan" | "confirm">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleStart() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/totp/setup", { method: "POST" });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Erro ao gerar QR code"); return; }
    setQrDataUrl(data.qrDataUrl);
    setSecret(data.secret);
    setStep("scan");
  }

  async function handleConfirm() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/totp/confirmar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, code: code.replace(/\D/g, "") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Código inválido"); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="max-w-sm w-full border border-border p-8 text-center" style={{ background: "var(--paper)" }}>
          <p className="text-success text-sm mb-2">2FA configurado com sucesso!</p>
          <p className="text-muted text-xs mb-6">Faça login novamente para entrar no painel.</p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full px-4 py-3 text-xs uppercase tracking-widest text-background transition-colors"
            style={{ background: "var(--red)" }}
          >
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="max-w-sm w-full border border-border" style={{ background: "var(--paper)" }}>
        <div className="border-b border-border px-6 py-5">
          <p className="text-xs uppercase tracking-widest text-danger mb-1">Obrigatório</p>
          <h1 className="text-xl font-light text-primary">Configurar autenticação em dois fatores</h1>
          <p className="text-xs text-muted mt-2">
            Contas de administrador exigem 2FA. Configure agora para continuar.
          </p>
        </div>

        <div className="px-6 py-6 flex flex-col gap-4">
          {step === "idle" && (
            <>
              <p className="text-sm text-muted">
                Instale Google Authenticator, Authy ou qualquer aplicativo TOTP, depois clique em começar.
              </p>
              {error && <p className="text-xs text-danger">{error}</p>}
              <button
                onClick={handleStart}
                disabled={loading}
                className="w-full px-4 py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
                style={{ background: "var(--red)" }}
              >
                {loading ? "Aguarde..." : "Começar configuração"}
              </button>
            </>
          )}

          {step === "scan" && (
            <>
              <p className="text-sm text-muted">Escaneie o QR code com o aplicativo autenticador:</p>
              {qrDataUrl && (
                <div className="flex justify-center p-4 bg-white">
                  <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} />
                </div>
              )}
              <p className="text-xs text-muted break-all">
                Código manual: <span className="text-primary font-mono">{secret}</span>
              </p>
              <button
                onClick={() => setStep("confirm")}
                className="w-full px-4 py-3 text-xs uppercase tracking-widest text-background"
                style={{ background: "var(--red)" }}
              >
                Já escaneei — inserir código
              </button>
            </>
          )}

          {step === "confirm" && (
            <>
              <p className="text-sm text-muted">Digite o código de 6 dígitos do aplicativo:</p>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                autoFocus
                className="w-full border border-border bg-transparent px-3 py-3 text-lg text-primary text-center tracking-[0.5em] placeholder:text-muted focus:outline-none focus:border-accent"
              />
              {error && <p className="text-xs text-danger">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={handleConfirm}
                  disabled={loading || code.length !== 6}
                  className="flex-1 px-4 py-3 text-xs uppercase tracking-widest text-background disabled:opacity-50"
                  style={{ background: "var(--red)" }}
                >
                  {loading ? "Verificando..." : "Confirmar"}
                </button>
                <button
                  onClick={() => { setStep("scan"); setCode(""); setError(""); }}
                  className="px-4 py-3 text-xs uppercase tracking-widest text-muted border border-border"
                >
                  Voltar
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
