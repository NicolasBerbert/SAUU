"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LojaToggle({ initialValue }: { initialValue: boolean }) {
  const router = useRouter();
  const [active, setActive] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !active;
    const confirmMsg = next
      ? "Ativar a loja? Ela ficará visível para todos os visitantes."
      : "Desativar a loja? Os visitantes serão redirecionados para a página inicial.";
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/configuracoes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: "lojaAtiva", value: next }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setActive(next);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <button
        onClick={toggle}
        disabled={loading}
        aria-label={active ? "Desativar loja" : "Ativar loja"}
        className="relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50"
        style={{
          borderColor: active ? "var(--accent)" : "var(--line)",
          background: active ? "var(--accent)" : "var(--surface)",
        }}
      >
        <span
          className="inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200"
          style={{ transform: active ? "translateX(22px)" : "translateX(2px)" }}
        />
      </button>
      <span
        className="text-[10px] uppercase tracking-widest"
        style={{ color: active ? "var(--accent)" : "var(--muted)" }}
      >
        {loading ? "Salvando…" : active ? "Ativa" : "Desativada"}
      </span>
      {error && <span className="text-[10px] text-danger">{error}</span>}
    </div>
  );
}
