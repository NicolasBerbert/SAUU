"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LimparPendentesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  async function handleLimpar() {
    setLoading(true);
    setResultado(null);
    try {
      const res = await fetch("/api/admin/limpar-pendentes", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setResultado(`${data.pedidosCancelados} pedidos e ${data.registracoesExpiradas} inscrições liberados.`);
        router.refresh();
      } else {
        setResultado("Erro ao limpar.");
      }
    } catch {
      setResultado("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      {resultado && <span className="text-[10px] text-muted">{resultado}</span>}
      <button
        onClick={handleLimpar}
        disabled={loading}
        className="border border-danger text-danger text-[10px] uppercase tracking-widest px-3 py-1.5 hover:bg-danger hover:text-background transition-colors disabled:opacity-40"
      >
        {loading ? "Limpando..." : "Liberar estoque"}
      </button>
    </div>
  );
}
