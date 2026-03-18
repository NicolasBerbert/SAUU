"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";

interface Props {
  enabled: boolean;
}

export function TotpSetupPanel({ enabled: initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<"idle" | "scan" | "confirm" | "disable">("idle");
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  async function handleSetup() {
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
    setEnabled(true);
    setStep("idle");
    setSuccess("2FA ativado com sucesso! O código será exigido no próximo login.");
    setCode("");
  }

  async function handleDisable() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/totp/confirmar", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: code.replace(/\D/g, "") }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error ?? "Código inválido"); return; }
    setEnabled(false);
    setStep("idle");
    setSuccess("2FA desativado.");
    setCode("");
  }

  return (
    <div className="border border-border">
      <div className="px-4 py-3 border-b border-border bg-surface flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted">Status</p>
        <span className={`text-xs uppercase tracking-widest ${enabled ? "text-success" : "text-muted"}`}>
          {enabled ? "Ativo" : "Inativo"}
        </span>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        {success && (
          <p className="text-xs text-success border border-success/20 bg-success/5 px-4 py-3">{success}</p>
        )}

        {/* Estado idle */}
        {step === "idle" && (
          <>
            <p className="text-sm text-muted">
              {enabled
                ? "O 2FA está ativo. Cada login exigirá um código do aplicativo autenticador."
                : "Ative o 2FA para proteger sua conta com um segundo fator de autenticação (Google Authenticator, Authy, etc.)."}
            </p>
            {!enabled && (
              <Button onClick={handleSetup} loading={loading} className="text-xs uppercase tracking-widest py-3">
                Ativar 2FA
              </Button>
            )}
            {enabled && (
              <button
                onClick={() => { setStep("disable"); setError(""); setCode(""); }}
                className="text-xs uppercase tracking-widest text-danger border border-danger/30 px-4 py-3 hover:bg-danger/5 transition-colors"
              >
                Desativar 2FA
              </button>
            )}
          </>
        )}

        {/* Passo: escanear QR code */}
        {step === "scan" && (
          <>
            <p className="text-sm text-muted">
              Escaneie o QR code com o aplicativo autenticador:
            </p>
            {qrDataUrl && (
              <div className="flex justify-center p-4 bg-white rounded">
                <img src={qrDataUrl} alt="QR Code 2FA" width={200} height={200} />
              </div>
            )}
            <p className="text-xs text-muted break-all">
              Secret manual: <span className="text-primary font-mono">{secret}</span>
            </p>
            <Button onClick={() => setStep("confirm")} className="text-xs uppercase tracking-widest py-3">
              Já escaneei — inserir código
            </Button>
          </>
        )}

        {/* Passo: confirmar código */}
        {(step === "confirm" || step === "disable") && (
          <>
            <p className="text-sm text-muted">
              {step === "confirm"
                ? "Digite o código de 6 dígitos do aplicativo para confirmar:"
                : "Digite o código atual do aplicativo para desativar o 2FA:"}
            </p>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              autoFocus
              className="w-full bg-transparent border border-border px-3 py-2 text-lg text-primary text-center tracking-[0.5em] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            />
            {error && (
              <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">{error}</p>
            )}
            <div className="flex gap-3">
              <Button
                onClick={step === "confirm" ? handleConfirm : handleDisable}
                loading={loading}
                className="flex-1 text-xs uppercase tracking-widest py-3"
              >
                {step === "confirm" ? "Confirmar" : "Desativar"}
              </Button>
              <button
                onClick={() => { setStep("idle"); setError(""); setCode(""); }}
                className="text-xs uppercase tracking-widest text-muted border border-border px-4 py-3 hover:border-primary transition-colors"
              >
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
