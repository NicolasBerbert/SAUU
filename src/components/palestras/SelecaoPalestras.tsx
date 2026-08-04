"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn, presentationsConflict } from "@/lib/utils";

interface Presentation {
  id: string;
  title: string;
  speaker: string;
  bio: string | null;
  day: number;
  slot: string;
  duration: number;
  maxCapacity: number;
  spotsLeft: number;
  isUserRegistered: boolean;
}

interface SelecaoPalestrasProps {
  presentations: Presentation[];
  locked: boolean;
}

export function SelecaoPalestras({ presentations, locked }: SelecaoPalestrasProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const registered = presentations.filter((p) => p.isUserRegistered);
  const registeredCount = registered.length;

  // Uma palestra conflita se acontece ao mesmo tempo que outra já selecionada.
  function conflictsWithSelection(p: Presentation): boolean {
    if (p.isUserRegistered) return false;
    return registered.some((r) => presentationsConflict(p, r));
  }

  const days = [1, 2, 3, 4];

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

  async function confirmarSelecao() {
    if (
      !confirm(
        "Confirmar suas palestras? Após confirmar, você NÃO poderá mais adicionar ou remover palestras."
      )
    ) {
      return;
    }
    setError(null);
    setConfirming(true);
    const res = await fetch("/api/inscricoes/confirmar", { method: "POST" });
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Erro ao confirmar. Tente novamente.");
      setConfirming(false);
      return;
    }
    // Sucesso: leva para a tela de confirmação.
    router.push("/inscricao/confirmado");
  }

  return (
    <div>
      {/* Banner de confirmação */}
      {locked && (
        <div className="mb-6 flex items-center gap-2 border border-accent/30 bg-accent/5 px-4 py-3 text-xs text-accent">
          <span>✓</span>
          <span>Suas palestras estão confirmadas. A seleção não pode mais ser alterada.</span>
        </div>
      )}

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
                {dayPresentations.map((p) => {
                  const isLoading = loadingId === p.id;
                  const isFull = p.spotsLeft <= 0 && !p.isUserRegistered;
                  const hasConflict = conflictsWithSelection(p);
                  const disabled =
                    locked || isLoading || isPending || (!p.isUserRegistered && (isFull || hasConflict));

                  return (
                    <div
                      key={p.id}
                      className={cn(
                        "bg-surface px-6 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4",
                        p.isUserRegistered && "bg-surface-2"
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted shrink-0">{p.slot}</span>
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
                        <span
                          className={cn(
                            "text-xs",
                            isFull || (hasConflict && !p.isUserRegistered) ? "text-danger" : "text-muted"
                          )}
                        >
                          {isFull
                            ? "Esgotado"
                            : hasConflict && !p.isUserRegistered
                            ? "Conflito de horário"
                            : `${p.spotsLeft} vaga${p.spotsLeft !== 1 ? "s" : ""}`}
                        </span>
                        {!locked && (
                          <button
                            onClick={() => toggleInscricao(p)}
                            disabled={disabled}
                            className={cn(
                              "text-xs uppercase tracking-widest px-4 py-2 border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
                              p.isUserRegistered
                                ? "border-border text-muted hover:border-danger hover:text-danger"
                                : "border-accent text-accent hover:bg-accent hover:text-background"
                            )}
                          >
                            {isLoading ? "..." : p.isUserRegistered ? "Cancelar" : "Inscrever-se"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmar e travar seleção */}
      {!locked && (
        <div className="mt-8 flex flex-col items-start gap-3 border border-border bg-surface px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted">
            Ao confirmar, sua seleção será <strong className="text-primary">travada</strong> e não poderá mais ser alterada.
          </p>
          <button
            onClick={confirmarSelecao}
            disabled={registeredCount === 0 || confirming || isPending}
            className="text-xs uppercase tracking-widest px-6 py-3 border border-accent bg-accent text-background transition-colors hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {confirming ? "Confirmando..." : "Confirmar palestras"}
          </button>
        </div>
      )}
    </div>
  );
}
