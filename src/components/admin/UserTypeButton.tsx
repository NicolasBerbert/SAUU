"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  userId: string;
  currentType: string;
  userName: string;
  isSelf: boolean;
}

const TYPE_LABEL: Record<string, string> = {
  UNIFIL: "Unifil",
  EXTERNO: "Externo",
  FORMADO: "Formado",
  ADMIN: "Admin",
};

export function UserTypeButton({ userId, currentType, userName, isSelf }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = currentType === "ADMIN";

  async function handleChangeType(newType: string) {
    const confirmMsg = isAdmin
      ? `Revogar admin de "${userName}"? Ele será marcado como Externo.`
      : `Tornar "${userName}" administrador? Ele terá acesso total ao painel.`;

    if (!confirm(confirmMsg)) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/usuarios/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: newType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao atualizar");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  if (isSelf) {
    return (
      <span className="text-[10px] uppercase tracking-widest text-muted opacity-40">
        (você)
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {isAdmin ? (
        <button
          onClick={() => handleChangeType("EXTERNO")}
          disabled={loading}
          className="text-[10px] uppercase tracking-widest text-danger hover:text-danger/70 transition-colors disabled:opacity-40"
        >
          {loading ? "…" : "Revogar Admin"}
        </button>
      ) : (
        <button
          onClick={() => handleChangeType("ADMIN")}
          disabled={loading}
          className="text-[10px] uppercase tracking-widest text-accent hover:text-accent/70 transition-colors disabled:opacity-40"
        >
          {loading ? "…" : "Tornar Admin"}
        </button>
      )}
      {error && (
        <span className="text-[10px] text-danger">{error}</span>
      )}
    </div>
  );
}
