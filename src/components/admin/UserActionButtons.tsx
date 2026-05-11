"use client";

import { useState } from "react";

interface Props {
  userId: string;
  userName: string;
  emailVerified: boolean;
  paymentStatus: string | null;
}

export function UserActionButtons({ userId, userName, emailVerified, paymentStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function action(endpoint: string, label: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(label);
    setMessage(null);
    const res = await fetch(`/api/admin/usuarios/${userId}/${endpoint}`, { method: "POST" });
    const data = await res.json();
    setLoading(null);
    setMessage({ text: res.ok ? "OK" : (data.error ?? "Erro"), ok: res.ok });
    if (res.ok) setTimeout(() => setMessage(null), 3000);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {message && (
        <span className={`text-[10px] uppercase tracking-widest ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </span>
      )}

      {/* Reenviar verificação */}
      {!emailVerified && (
        <button
          onClick={() => action("reenviar-verificacao", "reenviar")}
          disabled={loading === "reenviar"}
          title="Reenviar e-mail de verificação"
          className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 text-muted hover:text-primary hover:border-primary disabled:opacity-40 transition-colors"
        >
          {loading === "reenviar" ? "..." : "Reenviar e-mail"}
        </button>
      )}

      {/* Marcar como pago */}
      {paymentStatus !== "APPROVED" && paymentStatus !== "REFUNDED" && (
        <button
          onClick={() => action("marcar-pago", "marcar", `Marcar inscrição de ${userName} como paga (cortesia)?`)}
          disabled={loading === "marcar"}
          title="Marcar inscrição como paga (cortesia)"
          className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 text-muted hover:text-success hover:border-success disabled:opacity-40 transition-colors"
        >
          {loading === "marcar" ? "..." : "Marcar pago"}
        </button>
      )}

      {/* Reembolsar */}
      {paymentStatus === "APPROVED" && (
        <button
          onClick={() => action("reembolso", "reembolso", `Emitir reembolso Stripe para ${userName}? Esta ação não pode ser desfeita.`)}
          disabled={loading === "reembolso"}
          title="Emitir reembolso no Stripe"
          className="text-[10px] uppercase tracking-widest border border-border px-2 py-1 text-muted hover:text-danger hover:border-danger disabled:opacity-40 transition-colors"
        >
          {loading === "reembolso" ? "..." : "Reembolsar"}
        </button>
      )}
    </div>
  );
}
