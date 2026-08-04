"use client";

import { useState } from "react";

export function ReenviarVerificacao({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [email, setEmail] = useState(defaultEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function reenviar(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/auth/reenviar-verificacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(body.error ?? "Não foi possível reenviar agora. Tente novamente.");
        return;
      }
      setStatus("sent");
      setMessage(body.message ?? "Se houver uma conta com este e-mail, enviamos um novo link.");
    } catch {
      setStatus("error");
      setMessage("Não foi possível reenviar agora. Tente novamente.");
    }
  }

  if (status === "sent") {
    return (
      <p className="mt-8 text-sm text-accent border border-accent/30 bg-accent/5 px-4 py-3">
        {message}
      </p>
    );
  }

  return (
    <form onSubmit={reenviar} className="mt-8 flex flex-col gap-3">
      <p className="text-xs text-muted">Não recebeu o e-mail? Reenvie o link:</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="flex-1 bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="text-xs uppercase tracking-widest border border-accent px-5 py-2.5 text-accent transition-colors hover:bg-accent hover:text-background disabled:opacity-40"
        >
          {status === "loading" ? "Enviando..." : "Reenviar"}
        </button>
      </div>
      {status === "error" && <p className="text-xs text-danger">{message}</p>}
    </form>
  );
}
