"use client";

import { useState } from "react";

export function TesteEmailButton() {
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    setStatus("loading");
    setMessage(null);
    try {
      const res = await fetch("/api/admin/teste-email", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setStatus("ok");
        setMessage(data.message ?? "E-mail enviado com sucesso");
      } else {
        setStatus("error");
        setMessage(data.error ?? "Erro ao enviar");
      }
    } catch {
      setStatus("error");
      setMessage("Erro de conexão");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <button
        onClick={handleClick}
        disabled={status === "loading"}
        className="text-[10px] uppercase tracking-widest px-4 py-2 border border-border text-muted hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
      >
        {status === "loading" ? "Enviando…" : "Testar e-mail"}
      </button>
      {message && (
        <p className={`text-[10px] ${status === "ok" ? "text-success" : "text-danger"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
