"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn, formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  active: boolean;
}

interface FormState {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  active: boolean;
}

const defaultForm: FormState = {
  name: "",
  description: "",
  price: "",
  stock: "0",
  imageUrl: "",
  active: true,
};

export function ProductManager({ initial }: { initial: Product[] }) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(p: Product) {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description ?? "",
      price: String(p.price),
      stock: String(p.stock),
      imageUrl: p.imageUrl ?? "",
      active: p.active,
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

    const body = {
      name: form.name,
      description: form.description || undefined,
      price: Number(form.price),
      stock: Number(form.stock),
      imageUrl: form.imageUrl || undefined,
      active: form.active,
    };

    const url = editingId ? `/api/loja/produtos/${editingId}` : "/api/loja/produtos";
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
    if (!confirm("Remover este produto?")) return;
    setLoading(true);
    try {
      await fetch(`/api/loja/produtos/${id}`, { method: "DELETE" });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActive(p: Product) {
    setLoading(true);
    try {
      await fetch(`/api/loja/produtos/${p.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: p.name,
          description: p.description,
          price: p.price,
          stock: p.stock,
          imageUrl: p.imageUrl,
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
        <p className="text-xs text-muted">{initial.length} produto{initial.length !== 1 ? "s" : ""} cadastrado{initial.length !== 1 ? "s" : ""}</p>
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
          {showForm && !editingId ? "Cancelar" : "+ Novo Produto"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="border border-border mb-8">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">
              {editingId ? "Editar Produto" : "Novo Produto"}
            </p>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">Nome</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Preço (R$)</label>
              <input
                required
                type="number"
                step="0.01"
                min="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Estoque</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">Descrição (opcional)</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent resize-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-muted mb-1">URL da imagem (opcional)</label>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                className="w-full bg-background border border-border px-3 py-2 text-sm text-primary focus:outline-none focus:border-accent"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                className="accent-accent"
              />
              <label htmlFor="active" className="text-xs text-muted cursor-pointer">Produto ativo (visível na loja)</label>
            </div>
          </div>
          {error && (
            <div className="mx-6 mb-4 text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
              {error}
            </div>
          )}
          <div className="px-6 pb-6 flex gap-3">
            <Button type="submit" variant="primary" className="text-xs tracking-widest uppercase" disabled={loading}>
              {loading ? "Salvando..." : editingId ? "Salvar alterações" : "Adicionar produto"}
            </Button>
            <Button type="button" variant="secondary" className="text-xs tracking-widest uppercase" onClick={resetForm}>
              Cancelar
            </Button>
          </div>
        </form>
      )}

      {/* List */}
      <div className="border border-border">
        <div className="hidden sm:grid sm:grid-cols-12 gap-4 px-6 py-3 border-b border-border bg-surface">
          <p className="col-span-4 text-[10px] uppercase tracking-widest text-muted">Produto</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Preço</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Estoque</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted">Status</p>
          <p className="col-span-2 text-[10px] uppercase tracking-widest text-muted text-right">Ações</p>
        </div>
        <div className="flex flex-col gap-px bg-border">
          {initial.length === 0 && (
            <div className="bg-surface px-6 py-10 text-center">
              <p className="text-sm text-muted">Nenhum produto cadastrado.</p>
            </div>
          )}
          {initial.map((p) => (
            <div
              key={p.id}
              className={cn(
                "bg-surface px-6 py-4 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-4 sm:items-center",
                !p.active && "opacity-50"
              )}
            >
              <div className="sm:col-span-4 min-w-0">
                <p className="text-sm text-primary truncate">{p.name}</p>
                {p.description && <p className="text-xs text-muted truncate">{p.description}</p>}
              </div>
              <p className="sm:col-span-2 text-sm text-accent">{formatCurrency(p.price)}</p>
              <p className={`sm:col-span-2 text-xs ${p.stock === 0 ? "text-danger" : "text-muted"}`}>
                {p.stock === 0 ? "Esgotado" : `${p.stock} un.`}
              </p>
              <p className={`sm:col-span-2 text-xs ${p.active ? "text-success" : "text-muted"}`}>
                {p.active ? "Ativo" : "Inativo"}
              </p>
              <div className="sm:col-span-2 flex items-center gap-3 sm:justify-end">
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
