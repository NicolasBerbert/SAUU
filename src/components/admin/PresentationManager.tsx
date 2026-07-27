"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, slotLabel } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Palestrante {
  id: string;
  name: string;
  role: string | null;
}

interface Presentation {
  id: string;
  title: string;
  speaker: string;
  speakers: { palestranteId: string }[];
  bio: string | null;
  day: number;
  slot: string;
  duration: number;
  maxCapacity: number;
  active: boolean;
  _count: { slots: number };
}

interface FormState {
  title: string;
  palestranteIds: string[];
  bio: string;
  day: number;
  slot: string;
  duration: number;
  maxCapacity: number;
}

const defaultForm: FormState = {
  title: "",
  palestranteIds: [],
  bio: "",
  day: 1,
  slot: "19:00",
  duration: 90,
  maxCapacity: 50,
};

export function PresentationManager({
  initial,
  palestrantes,
}: {
  initial: Presentation[];
  palestrantes: Palestrante[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePalestrante(id: string) {
    setForm((f) => ({
      ...f,
      palestranteIds: f.palestranteIds.includes(id)
        ? f.palestranteIds.filter((x) => x !== id)
        : [...f.palestranteIds, id],
    }));
  }

  function startEdit(p: Presentation) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      palestranteIds: p.speakers.map((s) => s.palestranteId),
      bio: p.bio ?? "",
      day: p.day,
      slot: p.slot,
      duration: p.duration,
      maxCapacity: p.maxCapacity,
    });
    setShowForm(true);
    setError(null);
  }

  function resetForm() {
    setEditingId(null);
    setForm(defaultForm);
    setShowForm(false);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (form.palestranteIds.length === 0) {
      setError("Selecione ao menos um palestrante.");
      setLoading(false);
      return;
    }

    const body = {
      title: form.title,
      bio: form.bio,
      day: Number(form.day),
      slot: form.slot,
      duration: Number(form.duration),
      maxCapacity: Number(form.maxCapacity),
      palestranteIds: form.palestranteIds,
    };

    const url = editingId ? `/api/palestras/${editingId}` : "/api/palestras";
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Erro ao salvar");
      }
      resetForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover esta palestra?")) return;
    setLoading(true);
    try {
      await fetch(`/api/palestras/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(p: Presentation) {
    setLoading(true);
    try {
      await fetch(`/api/palestras/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: p.title,
          bio: p.bio ?? "",
          day: p.day,
          slot: p.slot,
          duration: p.duration,
          maxCapacity: p.maxCapacity,
          palestranteIds: p.speakers.map((s) => s.palestranteId),
          active: !p.active,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const noPalestrantes = palestrantes.length === 0;

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted">Palestras cadastradas: {initial.length}</p>
        <Button
          variant={showForm && !editingId ? "secondary" : "primary"}
          className="text-xs tracking-widest uppercase"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm();
            } else {
              resetForm();
              setShowForm(true);
            }
          }}
        >
          {showForm && !editingId ? "Cancelar" : "+ Nova Palestra"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border mb-8">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">
              {editingId ? "Editar Palestra" : "Nova Palestra"}
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">Título</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">
                Palestrante(s) <span className="text-muted font-normal">— marque um ou mais (roda de conversa)</span>
              </label>
              {noPalestrantes ? (
                <p className="text-xs text-muted border border-border px-3 py-2 bg-surface">
                  Nenhum palestrante cadastrado. Cadastre na aba{" "}
                  <a href="/admin/palestrantes" className="underline">Palestrantes</a> primeiro.
                </p>
              ) : (
                <div className="max-h-52 overflow-y-auto border border-border bg-background divide-y divide-border">
                  {palestrantes.map((p) => {
                    const checked = form.palestranteIds.includes(p.id);
                    return (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-primary hover:bg-surface"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePalestrante(p.id)}
                          className="accent-accent"
                        />
                        <span>
                          {p.name}
                          {p.role ? <span className="text-muted"> · {p.role}</span> : null}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {form.palestranteIds.length > 0 && (
                <p className="mt-1.5 text-[11px] text-muted">
                  {form.palestranteIds.length} palestrante{form.palestranteIds.length !== 1 ? "s" : ""} selecionado{form.palestranteIds.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs text-muted mb-1">Capacidade máxima</label>
              <input
                required
                type="number"
                min={1}
                value={form.maxCapacity}
                onChange={(e) => setForm((f) => ({ ...f, maxCapacity: Number(e.target.value) }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Dia</label>
              <select
                value={form.day}
                onChange={(e) => setForm((f) => ({ ...f, day: Number(e.target.value) }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                {[1, 2, 3, 4].map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Horário (ex: 19:00, 20:30)</label>
              <input
                required
                value={form.slot}
                onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value }))}
                placeholder="19:00"
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Duração (minutos)</label>
              <input
                required
                type="number"
                min={1}
                value={form.duration}
                onChange={(e) => setForm((f) => ({ ...f, duration: Number(e.target.value) }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">Descrição da palestra (opcional)</label>
              <textarea
                rows={3}
                value={form.bio}
                onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
          </div>
          {error && (
            <div className="mx-6 mb-4 text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
              {error}
            </div>
          )}
          <div className="px-6 pb-6 flex gap-3">
            <Button type="submit" variant="primary" className="text-xs tracking-widest uppercase" disabled={loading}>
              {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar palestra"}
            </Button>
            <Button type="button" variant="secondary" className="text-xs tracking-widest uppercase" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="border border-border">
        <div className="flex flex-col gap-px bg-border">
          {initial.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhuma palestra cadastrada.</p>
            </div>
          )}
          {initial.map((p) => (
            <div key={p.id} className={cn("bg-surface px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4", !p.active && "opacity-50")}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] uppercase tracking-widest text-muted">
                    Dia {p.day} — {slotLabel(p.slot)}
                  </span>
                  {!p.active && (
                    <span className="text-[10px] text-danger">inativa</span>
                  )}
                </div>
                <p className="text-sm text-primary font-medium truncate">{p.title}</p>
                <p className="text-xs text-muted">{p.speaker} · {p._count.slots}/{p.maxCapacity} inscritos · {p.duration}min</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleToggleActive(p)}
                  disabled={loading}
                  className="text-xs uppercase tracking-widest text-muted hover:text-primary transition-colors disabled:opacity-40"
                >
                  {p.active ? "Desativar" : "Ativar"}
                </button>
                <button
                  onClick={() => startEdit(p)}
                  className="text-xs uppercase tracking-widest text-muted hover:text-accent transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={loading}
                  className="text-xs uppercase tracking-widest text-muted hover:text-danger transition-colors disabled:opacity-40"
                >
                  Remover
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
