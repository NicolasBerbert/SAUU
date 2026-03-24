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

  return (
    <div className="flex flex-col gap-8">
      {palestras.map((palestra) => {
        const presentes = palestra.inscritos.filter((i) => i.attendedAt).length;
        return (
          <div key={palestra.id} className="border border-border">
            <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted mb-1">
                  Dia {palestra.day} — {palestra.slot}
                </p>
                <p className="text-sm text-primary font-medium">{palestra.title}</p>
                <p className="text-xs text-muted">{palestra.speaker}</p>
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-2xl font-light text-accent">{presentes}</p>
                <p className="text-xs text-muted">de {palestra.inscritos.length}</p>
              </div>
            </div>

            {palestra.inscritos.length === 0 ? (
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
                        {carregando ? "..." : presente ? "Presente" : "Ausente"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
