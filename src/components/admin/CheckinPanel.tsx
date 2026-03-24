"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Participante {
  id: string;
  name: string;
  email: string;
  type: string;
  eventRegistration: {
    paymentStatus: string;
    attendedAt: string | null;
  } | null;
}

const statusLabel: Record<string, { label: string; cor: string }> = {
  APPROVED: { label: "Pago", cor: "text-success" },
  PENDING:  { label: "Pendente", cor: "text-accent" },
  REJECTED: { label: "Rejeitado", cor: "text-danger" },
  CANCELLED:{ label: "Cancelado", cor: "text-danger" },
};

const tipoLabel: Record<string, string> = {
  UNIFIL: "Unifil",
  EXTERNO: "Ext.",
  FORMADO: "Formado",
};

export function CheckinPanel() {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<Participante[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; msg: string; ok: boolean } | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleBusca(valor: string) {
    setBusca(valor);
    setFeedback(null);
    if (debounce.current) clearTimeout(debounce.current);
    if (valor.trim().length < 2) {
      setResultados([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      setCarregando(true);
      try {
        const res = await fetch(`/api/admin/checkin?q=${encodeURIComponent(valor)}`);
        const data = await res.json();
        setResultados(data.results ?? []);
      } catch {
        setResultados([]);
      } finally {
        setCarregando(false);
      }
    }, 300);
  }

  async function handleCheckin(userId: string) {
    setConfirmando(userId);
    setFeedback(null);
    try {
      const res = await fetch("/api/admin/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ id: userId, msg: "Presença confirmada!", ok: true });
        router.refresh();
        // Atualiza o resultado localmente para refletir imediatamente
        setResultados((prev) =>
          prev.map((p) =>
            p.id === userId
              ? { ...p, eventRegistration: { ...p.eventRegistration!, attendedAt: new Date().toISOString(), paymentStatus: "APPROVED" } }
              : p
          )
        );
      } else {
        setFeedback({ id: userId, msg: data.error ?? "Erro ao confirmar", ok: false });
      }
    } catch {
      setFeedback({ id: userId, msg: "Erro de conexão", ok: false });
    } finally {
      setConfirmando(null);
    }
  }

  return (
    <div className="max-w-2xl">
      {/* Campo de busca */}
      <div className="border border-border mb-6">
        <div className="px-4 py-3 border-b border-border bg-surface">
          <p className="text-xs uppercase tracking-widest text-muted">Buscar participante</p>
        </div>
        <div className="px-4 py-4">
          <input
            type="text"
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            placeholder="Nome ou e-mail..."
            className="w-full bg-transparent border border-border px-3 py-2 text-sm text-primary placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>
      </div>

      {/* Resultados */}
      {carregando && (
        <p className="text-xs text-muted px-1">Buscando...</p>
      )}

      {!carregando && busca.length >= 2 && resultados.length === 0 && (
        <p className="text-xs text-muted px-1">Nenhum participante encontrado.</p>
      )}

      {resultados.length > 0 && (
        <div className="border border-border divide-y divide-border">
          {resultados.map((p) => {
            const reg = p.eventRegistration;
            const jaPresente = !!reg?.attendedAt;
            const pago = reg?.paymentStatus === "APPROVED";
            const fb = feedback?.id === p.id ? feedback : null;
            const status = reg ? (statusLabel[reg.paymentStatus] ?? { label: reg.paymentStatus, cor: "text-muted" }) : null;

            return (
              <div key={p.id} className="px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-primary mb-0.5 truncate">{p.name}</p>
                    <p className="text-xs text-muted truncate">{p.email}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] uppercase tracking-widest text-muted border border-border px-2 py-0.5">
                        {tipoLabel[p.type] ?? p.type}
                      </span>
                      {status && (
                        <span className={`text-[10px] uppercase tracking-widest ${status.cor}`}>
                          Inscrição: {status.label}
                        </span>
                      )}
                      {!reg && (
                        <span className="text-[10px] uppercase tracking-widest text-danger">
                          Sem inscrição
                        </span>
                      )}
                    </div>
                    {jaPresente && reg?.attendedAt && (
                      <p className="text-[10px] text-success mt-1">
                        Presença registrada em{" "}
                        {new Date(reg.attendedAt).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </p>
                    )}
                    {fb && (
                      <p className={`text-[10px] mt-1 ${fb.ok ? "text-success" : "text-danger"}`}>
                        {fb.msg}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleCheckin(p.id)}
                    disabled={!pago || jaPresente || confirmando === p.id}
                    className={`shrink-0 text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors
                      ${jaPresente
                        ? "border-success text-success cursor-default"
                        : pago
                          ? "border-accent text-accent hover:bg-accent hover:text-background"
                          : "border-border text-muted cursor-not-allowed opacity-40"
                      }`}
                  >
                    {confirmando === p.id
                      ? "..."
                      : jaPresente
                        ? "Presente"
                        : "Confirmar"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
