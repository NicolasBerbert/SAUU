"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      const res = await fetch("/api/auth/recuperar-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Erro ao enviar. Tente novamente.");
        setStatus("idle");
        return;
      }
      setMessage(body.message ?? "Se houver uma conta com este e-mail, enviamos um link.");
      setStatus("sent");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStatus("idle");
    }
  }

  return (
    <div>
      <div className="mb-9">
        <div className="mb-3.5 text-[11px] uppercase tracking-[0.24em]" style={{ color: "var(--red)" }}>
          Recuperar senha
        </div>
        <h2 className="mb-2 font-display leading-none" style={{ fontSize: "42px" }}>
          Esqueceu a<br />senha?
        </h2>
        <p className="text-[14px] text-muted">
          Informe seu e-mail e enviaremos um link para redefinir sua senha.
        </p>
      </div>

      {status === "sent" ? (
        <div
          className="px-4 py-3 text-[13px]"
          style={{ color: "var(--sage)", border: "1px solid var(--sage)", background: "rgba(140,150,115,0.08)" }}
        >
          {message} Verifique sua caixa de entrada (e o spam). O link expira em 1 hora.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="seunome@email.com"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">{error}</p>
          )}

          <Button
            type="submit"
            loading={status === "loading"}
            className="mt-2 py-4 text-xs tracking-widest uppercase"
          >
            Enviar link
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-[13px] text-muted">
        Lembrou a senha?{" "}
        <Link
          href="/login"
          className="border-b border-current pb-0.5 transition-colors hover:text-accent"
          style={{ color: "var(--red)" }}
        >
          Voltar ao login
        </Link>
      </p>
    </div>
  );
}
