"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface PalestranteEntry {
  id: string;
  name: string;
  bio: string | null;
  imageUrl: string | null;
  role: string | null;
  order: number;
  active: boolean;
}

interface FormState {
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  order: string;
}

const EMPTY: FormState = { name: "", role: "", bio: "", imageUrl: "", order: "0" };

function toFormState(p: PalestranteEntry): FormState {
  return {
    name: p.name,
    role: p.role ?? "",
    bio: p.bio ?? "",
    imageUrl: p.imageUrl ?? "",
    order: String(p.order),
  };
}

export function PalestranteManager({ initial }: { initial: PalestranteEntry[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openAdd() {
    setAdding(true);
    setEditingId(null);
    setForm(EMPTY);
    setPreview(null);
    setError(null);
  }

  function openEdit(p: PalestranteEntry) {
    setEditingId(p.id);
    setAdding(false);
    setForm(toFormState(p));
    setPreview(p.imageUrl ?? null);
    setError(null);
  }

  function closeForm() {
    setAdding(false);
    setEditingId(null);
    setForm(EMPTY);
    setPreview(null);
    setError(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target!.result as string);
      reader.readAsDataURL(file);
    });
    setPreview(dataUrl);

    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
      setForm((p) => ({ ...p, imageUrl: data.url as string }));
      setPreview(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || undefined,
      bio: form.bio.trim() || undefined,
      imageUrl: form.imageUrl || undefined,
      order: parseInt(form.order) || 0,
      active: true,
    };

    try {
      const url = editingId ? `/api/palestrantes/${editingId}` : "/api/palestrantes";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar");
      }
      closeForm();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deletar "${name}"?`)) return;
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/palestrantes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao deletar");
      }
      setItems((prev) => prev.filter((p) => p.id !== id));
      if (editingId === id) closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao deletar");
    } finally {
      setDeletingId(null);
    }
  }

  const formFields = (
    <div className="px-6 pb-6 pt-5" style={{ borderTop: "1px solid var(--line)" }}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[200px_1fr]">
        {/* Photo */}
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden"
            style={{ width: "100%", aspectRatio: "3/4", background: "var(--surface)", border: "1px solid var(--line)" }}
          >
            {preview ? (
              <Image src={preview} alt="Preview" fill className="object-cover object-top" unoptimized />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="font-display text-[64px]" style={{ color: "var(--line)" }}>
                  {form.name.charAt(0).toUpperCase() || "?"}
                </span>
              </div>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(227,226,222,0.85)" }}>
                <span className="text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted)" }}>Enviando…</span>
              </div>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={uploading}
            className="block w-full text-xs text-muted file:mr-2 file:py-1.5 file:px-3 file:border file:border-border file:text-[10px] file:uppercase file:tracking-widest file:bg-surface file:text-muted hover:file:bg-background file:cursor-pointer disabled:opacity-50"
          />
          {form.imageUrl && (
            <button
              type="button"
              onClick={() => { setForm((p) => ({ ...p, imageUrl: "" })); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
              className="text-left text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-danger"
            >
              Remover foto
            </button>
          )}
        </div>

        {/* Text fields */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              className="w-full border px-3 py-2 text-sm text-primary focus:outline-none"
              style={{ background: "var(--bg)", borderColor: "var(--line)" }}
              placeholder="Nome completo"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Cargo / Área</label>
            <input
              value={form.role}
              onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))}
              className="w-full border px-3 py-2 text-sm text-primary focus:outline-none"
              style={{ background: "var(--bg)", borderColor: "var(--line)" }}
              placeholder="ex: Arquiteta e Urbanista"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Bio</label>
            <textarea
              rows={5}
              value={form.bio}
              onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
              className="w-full resize-none border px-3 py-2 text-sm text-primary focus:outline-none"
              style={{ background: "var(--bg)", borderColor: "var(--line)" }}
              placeholder="Formação, trajetória profissional, área de atuação…"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Ordem de exibição</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))}
              className="w-24 border px-3 py-2 text-sm text-primary focus:outline-none"
              style={{ background: "var(--bg)", borderColor: "var(--line)" }}
            />
          </div>

          {error && (
            <p className="text-xs border px-3 py-2" style={{ color: "var(--danger, #c0392b)", borderColor: "var(--danger, #c0392b)", background: "rgba(192,57,43,0.05)" }}>
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving || uploading || !form.name.trim()}
              className="px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-background transition-all hover:-translate-y-px disabled:opacity-50"
              style={{ background: "var(--red)" }}
            >
              {saving ? "Salvando…" : "Salvar"}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] transition-colors"
              style={{ color: "var(--muted)" }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {!adding && (
        <button
          onClick={openAdd}
          className="mb-6 px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-background transition-all hover:-translate-y-px"
          style={{ background: "var(--red)" }}
        >
          + Adicionar palestrante
        </button>
      )}

      {/* New palestrante form */}
      {adding && (
        <div className="mb-6" style={{ border: "1px solid var(--line)", background: "var(--paper)" }}>
          <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--line)", background: "var(--surface)" }}>
            <span className="text-[11px] uppercase tracking-widest text-muted">Novo palestrante</span>
          </div>
          {formFields}
        </div>
      )}

      {items.length === 0 && !adding ? (
        <div
          className="px-8 py-12 text-center text-sm"
          style={{ border: "1px dashed var(--line)", color: "var(--muted)" }}
        >
          Nenhum palestrante cadastrado ainda.
        </div>
      ) : (
        <div className="flex flex-col gap-px" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
          {items.map((p) => {
            const isEditing = editingId === p.id;
            return (
              <div key={p.id} style={{ background: "var(--paper)" }}>
                {/* Row */}
                <div className="flex items-center gap-5 px-6 py-5">
                  <div
                    className="relative shrink-0 overflow-hidden"
                    style={{ width: 72, height: 72, background: "var(--surface)", border: "1px solid var(--line)" }}
                  >
                    {p.imageUrl ? (
                      <Image src={p.imageUrl} alt={p.name} fill className="object-cover object-top" unoptimized />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-[28px]" style={{ color: "var(--line)" }}>
                          {p.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {p.role && (
                      <div className="text-[10px] uppercase tracking-[0.22em] mb-0.5" style={{ color: "var(--muted)" }}>
                        {p.role}
                      </div>
                    )}
                    <div className="text-[15px] font-medium text-primary truncate">{p.name}</div>
                    {p.bio && (
                      <div className="text-[12px] truncate" style={{ color: "var(--muted)" }}>{p.bio}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <button
                      onClick={() => isEditing ? closeForm() : openEdit(p)}
                      className="text-[11px] uppercase tracking-[0.18em] transition-colors"
                      style={{ color: isEditing ? "var(--muted)" : "var(--red)" }}
                    >
                      {isEditing ? "Cancelar" : "Editar"}
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.name)}
                      disabled={deletingId === p.id}
                      className="text-[11px] uppercase tracking-[0.18em] transition-colors disabled:opacity-40"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger, #c0392b)")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                    >
                      {deletingId === p.id ? "…" : "Deletar"}
                    </button>
                  </div>
                </div>

                {/* Inline edit form */}
                {isEditing && formFields}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
