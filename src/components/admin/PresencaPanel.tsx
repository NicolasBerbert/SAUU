"use client";

import { useState, useTransition } from "react";
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

  async function togglePresenca(slotId: string, presente: boolean) {
    setLoadingId(slotId);
    await fetch("/api/admin/presenca", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotId, presente }),
    });
    setLoadingId(null);
    startTransition(() => router.refresh());
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
                                  <button
                                    onClick={() => togglePresenca(inscrito.slotId, !presente)}
                                    disabled={carregando || isPending}
                                    className={cn(
                                      "shrink-0 text-[10px] uppercase tracking-widest px-4 py-2 border transition-colors disabled:opacity-40",
                                      presente
                                        ? "border-success text-success hover:border-danger hover:text-danger"
                                        : "border-border text-muted hover:border-accent hover:text-accent"
                                    )}
                                  >
                                    {carregando ? "..." : presente ? "Confirmado" : "Confirmar"}
                                  </button>
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
