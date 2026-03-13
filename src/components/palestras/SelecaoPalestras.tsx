"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, slotLabel } from "@/lib/utils";

interface Presentation {
  id: string;
  title: string;
  speaker: string;
  bio: string | null;
  day: number;
  slot: "SLOT_19H00" | "SLOT_20H45";
  maxCapacity: number;
  spotsLeft: number;
  isUserRegistered: boolean;
}

interface SelecaoPalestrasProps {
  presentations: Presentation[];
}

export function SelecaoPalestras({ presentations }: SelecaoPalestrasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const registeredCount = presentations.filter((p) => p.isUserRegistered).length;

  // Agrupar por dia e slot
  const days = [1, 2, 3, 4, 5];
  const slots = ["SLOT_19H00", "SLOT_20H45"] as const;

  async function toggleInscricao(presentation: Presentation) {
    setError(null);
    setLoadingId(presentation.id);

    const method = presentation.isUserRegistered ? "DELETE" : "POST";
    const res = await fetch("/api/inscricoes", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presentationId: presentation.id }),
    });

    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao processar. Tente novamente.");
      setLoadingId(null);
      return;
    }

    setLoadingId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div>
      {/* Contador */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted">
          {registeredCount === 0
            ? "Nenhuma palestra selecionada ainda"
            : `${registeredCount} palestra${registeredCount !== 1 ? "s" : ""} selecionada${registeredCount !== 1 ? "s" : ""}`}
        </p>
        <p className="text-xs text-muted">
          {presentations.length} disponíveis
        </p>
      </div>

      {error && (
        <div className="mb-6 text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6">
        {days.map((day) => {
          const dayPresentations = presentations.filter((p) => p.day === day);
          if (dayPresentations.length === 0) return null;

          return (
            <div key={day} className="border border-border">
              {/* Cabeçalho do dia */}
              <div className="px-6 py-4 border-b border-border bg-surface">
                <p className="text-xs uppercase tracking-widest text-muted">
                  Dia {day}
                </p>
              </div>

              {/* Palestras do dia */}
              <div className="flex flex-col gap-px bg-border">
                {slots.map((slot) => {
                  const p = dayPresentations.find((x) => x.slot === slot);
                  if (!p) {
                    return (
                      <div key={slot} className="bg-surface px-6 py-5">
                        <p className="text-xs text-muted">
                          {slotLabel(slot)} — Palestra a confirmar
                        </p>
                      </div>
                    );
                  }

                  const isLoading = loadingId === p.id;
                  const isFull = p.spotsLeft <= 0 && !p.isUserRegistered;

                  return (
                    <div
                      key={slot}
                      className={cn(
                        "bg-surface px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        p.isUserRegistered && "bg-surface-2"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted shrink-0">
                            {slotLabel(slot)}
                          </span>
                          {p.isUserRegistered && (
                            <span className="text-xs text-accent">— inscrito</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-primary mb-0.5 truncate">
                          {p.title}
                        </p>
                        <p className="text-xs text-muted">{p.speaker}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        {/* Vagas */}
                        <span
                          className={cn(
                            "text-xs",
                            isFull ? "text-danger" : "text-muted"
                          )}
                        >
                          {isFull
                            ? "Esgotado"
                            : `${p.spotsLeft} vaga${p.spotsLeft !== 1 ? "s" : ""}`}
                        </span>

                        {/* Botão */}
                        <button
                          onClick={() => toggleInscricao(p)}
                          disabled={isLoading || (isFull && !p.isUserRegistered) || isPending}
                          className={cn(
                            "text-xs uppercase tracking-widest px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                            p.isUserRegistered
                              ? "border-border text-muted hover:border-danger hover:text-danger"
                              : "border-accent text-accent hover:bg-accent hover:text-background"
                          )}
                        >
                          {isLoading
                            ? "..."
                            : p.isUserRegistered
                            ? "Cancelar"
                            : "Inscrever-se"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
