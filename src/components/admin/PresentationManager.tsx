"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, slotLabel } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Presentation {
  id: string;
  title: string;
  speaker: string;
  bio: string | null;
  day: number;
  slot: "SLOT_19H00" | "SLOT_20H45";
  maxCapacity: number;
  active: boolean;
  _count: { slots: number };
}

interface FormState {
  title: string;
  speaker: string;
  bio: string;
  day: number;
  slot: "SLOT_19H00" | "SLOT_20H45";
  maxCapacity: number;
}

const defaultForm: FormState = {
  title: "",
  speaker: "",
  bio: "",
  day: 1,
  slot: "SLOT_19H00",
  maxCapacity: 50,
};

export function PresentationManager({ initial }: { initial: Presentation[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(p: Presentation) {
    setEditingId(p.id);
    setForm({
      title: p.title,
      speaker: p.speaker,
      bio: p.bio ?? "",
      day: p.day,
      slot: p.slot,
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

    const body = { ...form, maxCapacity: Number(form.maxCapacity), day: Number(form.day) };
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
          speaker: p.speaker,
          bio: p.bio ?? "",
          day: p.day,
          slot: p.slot,
          maxCapacity: p.maxCapacity,
          active: !p.active,
        }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted">Grade: 5 dias × 2 horários = 10 palestras</p>
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
            <div>
              <label className="block text-xs text-muted mb-1">Palestrante</label>
              <input
                required
                value={form.speaker}
                onChange={(e) => setForm((f) => ({ ...f, speaker: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
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
                {[1, 2, 3, 4, 5].map((d) => (
                  <option key={d} value={d}>Dia {d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Horário</label>
              <select
                value={form.slot}
                onChange={(e) => setForm((f) => ({ ...f, slot: e.target.value as FormState["slot"] }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              >
                <option value="SLOT_19H00">19h00</option>
                <option value="SLOT_20H45">20h45</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">Bio / Descrição (opcional)</label>
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
                <p className="text-xs text-muted">{p.speaker} · {p._count.slots}/{p.maxCapacity} inscritos</p>
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
