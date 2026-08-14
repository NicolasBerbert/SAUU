"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Inscrito {
  slotId: string;
  userId: string;
  name: string;
  email: string;
  attendedAt: string | null;
}

interface Palestra {
  id: string;
  title: string;
  speaker: string;
  day: number;
  slot: string;
  inscritos: Inscrito[];
}

interface UsuarioBusca {
  id: string;
  name: string;
  email: string;
  type: string;
}

export function PresencaPanel({ palestras }: { palestras: Palestra[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function refresh() {
    startTransition(() => router.refresh());
  }

  async function togglePresenca(slotId: string, presente: boolean) {
    setLoadingId(slotId);
    await fetch("/api/admin/presenca", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, presente }),
    });
    setLoadingId(null);
    refresh();
  }

  async function removerInscrito(slotId: string) {
    if (!confirm("Remover esta pessoa da palestra? Isso também remove das horas e do painel dela.")) return;
    setLoadingId(slotId);
    await fetch("/api/admin/presenca", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId }),
    });
    setLoadingId(null);
    refresh();
  }

  if (palestras.length === 0) {
    return (
      <div className="border border-border border-dashed p-16 text-center">
        <p className="text-sm text-muted">Nenhuma palestra cadastrada.</p>
      </div>
    );
  }

  const byDay = palestras.reduce<Record<number, Palestra[]>>((acc, p) => {
    if (!acc[p.day]) acc[p.day] = [];
    acc[p.day].push(p);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-6">
      {[1, 2, 3, 4].map((day) => {
        const dayPalestras = byDay[day];
        if (!dayPalestras?.length) return null;

        return (
          <div key={day}>
            {/* Day label */}
            <div className="mb-2 flex items-center gap-3">
              <span
                className="font-display text-[32px] leading-none"
                style={{ color: "var(--red)" }}
              >
                0{day}
              </span>
              <span className="text-xs uppercase tracking-widest text-muted">
                Dia {day}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {dayPalestras.map((palestra) => {
                const isOpen = expanded.has(palestra.id);
                const presentes = palestra.inscritos.filter((i) => i.attendedAt).length;
                const total = palestra.inscritos.length;

                return (
                  <div
                    key={palestra.id}
                    className="border border-border"
                    style={{ background: "var(--paper)" }}
                  >
                    {/* Header — clickable to expand */}
                    <button
                      onClick={() => toggle(palestra.id)}
                      className="w-full text-left px-6 py-4 flex items-center justify-between gap-4 transition-colors hover:bg-background"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-xs uppercase tracking-widest text-muted mb-1">
                          {palestra.slot}
                        </p>
                        <p className="text-sm text-primary font-medium truncate">
                          {palestra.title}
                        </p>
                        <p className="text-xs text-muted">{palestra.speaker}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-lg font-light text-accent">{presentes}</p>
                          <p className="text-xs text-muted">de {total}</p>
                        </div>
                        <span
                          className={cn(
                            "grid h-8 w-8 place-items-center border text-lg transition-transform duration-200",
                            isOpen ? "rotate-45" : ""
                          )}
                          style={{ borderColor: "var(--line)", color: "var(--ink)" }}
                        >
                          +
                        </span>
                      </div>
                    </button>

                    {/* Collapsible user list */}
                    {isOpen && (
                      <div className="border-t border-border">
                        {/* Adicionar pessoa manualmente */}
                        <AdicionarPessoa presentationId={palestra.id} onAdded={refresh} />

                        {total === 0 ? (
                          <div className="px-6 py-6 text-center">
                            <p className="text-xs text-muted">Nenhum inscrito nesta palestra.</p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-px bg-border">
                            {palestra.inscritos.map((inscrito) => {
                              const presente = !!inscrito.attendedAt;
                              const carregando = loadingId === inscrito.slotId;
                              return (
                                <div
                                  key={inscrito.slotId}
                                  className={cn(
                                    "bg-surface px-6 py-3 flex items-center justify-between gap-4",
                                    presente && "bg-surface-2"
                                  )}
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-primary truncate">{inscrito.name}</p>
                                    <p className="text-xs text-muted truncate">{inscrito.email}</p>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <button
                                      onClick={() => togglePresenca(inscrito.slotId, !presente)}
                                      disabled={carregando || isPending}
                                      className={cn(
                                        "text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors disabled:opacity-40",
                                        presente
                                          ? "border-success text-success hover:border-danger hover:text-danger"
                                          : "border-border text-muted hover:border-accent hover:text-accent"
                                      )}
                                    >
                                      {carregando ? "..." : presente ? "Confirmado" : "Confirmar"}
                                    </button>
                                    <button
                                      onClick={() => removerInscrito(inscrito.slotId)}
                                      disabled={carregando || isPending}
                                      title="Remover da palestra"
                                      className="text-[10px] uppercase tracking-widest px-3 py-2 border border-border text-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-40"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdicionarPessoa({
  presentationId,
  onAdded,
}: {
  presentationId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<UsuarioBusca[]>([]);
  const [marcar, setMarcar] = useState(true);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/admin/usuarios/buscar?q=${encodeURIComponent(q)}`);
        if (res.ok) setResults(await res.json());
      } catch {
        /* ignora */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [q, open]);

  async function adicionar(userId: string) {
    setLoading(true);
    setMsg("");
    try {
      const res = await fetch("/api/admin/presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, presentationId, marcarPresenca: marcar }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(body.error ?? "Erro ao adicionar.");
        setLoading(false);
        return;
      }
      setQ("");
      setResults([]);
      setMsg("Adicionado!");
      setLoading(false);
      onAdded();
    } catch {
      setMsg("Erro de conexão.");
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <div className="px-6 py-3 border-b border-border bg-surface">
        <button
          onClick={() => setOpen(true)}
          className="text-[10px] uppercase tracking-widest text-accent hover:text-primary transition-colors"
        >
          + Adicionar pessoa manualmente
        </button>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 border-b border-border bg-surface">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] uppercase tracking-widest text-muted">Adicionar pessoa</p>
        <button
          onClick={() => {
            setOpen(false);
            setQ("");
            setResults([]);
            setMsg("");
          }}
          className="text-[10px] uppercase tracking-widest text-muted hover:text-danger transition-colors"
        >
          Fechar
        </button>
      </div>

      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar por nome ou e-mail…"
        className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
      />

      <label className="mt-2 flex items-center gap-2 text-[11px] text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={marcar}
          onChange={(e) => setMarcar(e.target.checked)}
          className="accent-accent"
        />
        Marcar presença ao adicionar (conta horas na hora)
      </label>

      {msg && <p className="mt-2 text-[11px] text-accent">{msg}</p>}

      {results.length > 0 && (
        <div className="mt-2 border border-border divide-y divide-border max-h-60 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => adicionar(u.id)}
              disabled={loading}
              className="w-full text-left px-3 py-2 flex items-center justify-between gap-3 hover:bg-background transition-colors disabled:opacity-40"
            >
              <span className="min-w-0">
                <span className="block text-sm text-primary truncate">{u.name}</span>
                <span className="block text-[11px] text-muted truncate">{u.email}</span>
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-accent">
                Adicionar
              </span>
            </button>
          ))}
        </div>
      )}

      {q.trim().length >= 2 && results.length === 0 && (
        <p className="mt-2 text-[11px] text-muted">Nenhum usuário encontrado.</p>
      )}
    </div>
  );
}
