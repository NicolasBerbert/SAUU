"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface SpeakerEntry {
  id: string;
  speaker: string;
  bio: string | null;
  imageUrl: string | null;
  title: string;
  day: number;
  slot: string;
  active: boolean;
}

interface EditState {
  speaker: string;
  bio: string;
  imageUrl: string;
}

export function SpeakerManager({ initial }: { initial: SpeakerEntry[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>({ speaker: "", bio: "", imageUrl: "" });
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function openEdit(s: SpeakerEntry) {
    setEditingId(s.id);
    setEdit({ speaker: s.speaker, bio: s.bio ?? "", imageUrl: s.imageUrl ?? "" });
    setPreview(s.imageUrl ?? null);
    setError(null);
  }

  function closeEdit() {
    setEditingId(null);
    setError(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // data URL preview (CSP-safe)
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
      const text = await res.text();
      let data: Record<string, unknown> = {};
      try { data = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) throw new Error((data.error as string) ?? `Erro ${res.status}`);
      if (!data.url) throw new Error("Resposta inesperada");
      setEdit((prev) => ({ ...prev, imageUrl: data.url as string }));
      setPreview(data.url as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro no upload");
      setPreview(null);
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleSave(entry: SpeakerEntry) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/palestras/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: entry.title,
          speaker: edit.speaker,
          bio: edit.bio,
          imageUrl: edit.imageUrl || undefined,
          day: entry.day,
          slot: entry.slot,
          duration: 90,
          maxCapacity: 50,
          active: entry.active,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Erro ao salvar");
      }
      closeEdit();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (initial.length === 0) {
    return (
      <div
        className="border px-8 py-12 text-center text-sm text-muted"
        style={{ border: "1px dashed var(--line)" }}
      >
        Nenhuma palestra cadastrada ainda. Adicione palestras primeiro na aba Palestras.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-px" style={{ background: "var(--line)", border: "1px solid var(--line)" }}>
      {initial.map((entry) => {
        const isEditing = editingId === entry.id;

        return (
          <div
            key={entry.id}
            style={{ background: "var(--paper)" }}
          >
            {/* Row header */}
            <div className="flex items-center gap-5 px-6 py-5">
              {/* Photo */}
              <div
                className="relative shrink-0 overflow-hidden"
                style={{ width: 72, height: 72, background: "var(--surface)", border: "1px solid var(--line)" }}
              >
                {entry.imageUrl ? (
                  <Image src={entry.imageUrl} alt={entry.speaker} fill className="object-cover object-top" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-display text-[28px]" style={{ color: "var(--line)" }}>
                      {entry.speaker.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-[0.22em] mb-0.5" style={{ color: "var(--muted)" }}>
                  Dia {entry.day} · {entry.slot}
                </div>
                <div className="text-[15px] font-medium text-primary truncate">{entry.speaker}</div>
                <div className="text-[12px] text-muted truncate">{entry.title}</div>
              </div>

              {/* Edit toggle */}
              <button
                onClick={() => isEditing ? closeEdit() : openEdit(entry)}
                className="shrink-0 text-[11px] uppercase tracking-[0.18em] transition-colors"
                style={{ color: isEditing ? "var(--muted)" : "var(--accent, var(--red))" }}
              >
                {isEditing ? "Cancelar" : "Editar"}
              </button>
            </div>

            {/* Edit form */}
            {isEditing && (
              <div
                className="px-6 pb-6"
                style={{ borderTop: "1px solid var(--line)" }}
              >
                <div className="grid grid-cols-1 gap-4 pt-5 sm:grid-cols-[200px_1fr]">
                  {/* Photo upload */}
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
                            {edit.speaker.charAt(0)}
                          </span>
                        </div>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(227,226,222,0.8)" }}>
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

                    {edit.imageUrl && (
                      <button
                        type="button"
                        onClick={() => { setEdit((p) => ({ ...p, imageUrl: "" })); setPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                        className="text-left text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-danger"
                      >
                        Remover foto
                      </button>
                    )}
                  </div>

                  {/* Fields */}
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Nome do palestrante</label>
                      <input
                        value={edit.speaker}
                        onChange={(e) => setEdit((p) => ({ ...p, speaker: e.target.value }))}
                        className="w-full border px-3 py-2 text-sm text-primary focus:outline-none"
                        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-muted mb-1">Bio / Mini-currículo</label>
                      <textarea
                        rows={6}
                        value={edit.bio}
                        onChange={(e) => setEdit((p) => ({ ...p, bio: e.target.value }))}
                        className="w-full resize-none border px-3 py-2 text-sm text-primary focus:outline-none"
                        style={{ background: "var(--bg)", borderColor: "var(--line)" }}
                        placeholder="Formação, trajetória profissional, área de atuação…"
                      />
                    </div>

                    {error && (
                      <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-3 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      onClick={() => handleSave(entry)}
                      disabled={saving || uploading}
                      className="self-start px-5 py-2.5 text-[11px] uppercase tracking-[0.22em] text-background transition-all hover:-translate-y-px disabled:opacity-50"
                      style={{ background: "var(--red)" }}
                    >
                      {saving ? "Salvando…" : "Salvar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
