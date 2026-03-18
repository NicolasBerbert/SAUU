"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function AlterarSenhaPage() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError("As novas senhas não coincidem");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("A nova senha deve ter ao menos 8 caracteres");
      return;
    }
    if (!/[0-9]/.test(form.newPassword)) {
      setError("A nova senha deve conter ao menos um número");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/perfil/senha", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao alterar senha");
      } else {
        setSuccess(true);
        setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-10">
        <div className="h-px w-8 bg-accent" />
        <span className="text-xs uppercase tracking-widest text-accent">Perfil</span>
      </div>
      <h1 className="text-2xl font-light tracking-wide text-foreground mb-2">Alterar Senha</h1>
      <p className="text-sm text-muted mb-10">Escolha uma senha com ao menos 8 caracteres e um número.</p>

      {success && (
        <div className="border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent mb-8">
          Senha alterada com sucesso. Faça login novamente na próxima sessão.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-sm space-y-6">
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Senha Atual
          </label>
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
            className="w-full bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Nova Senha
          </label>
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
            className="w-full bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase tracking-widest text-muted mb-2">
            Confirmar Nova Senha
          </label>
          <input
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full bg-surface border border-border px-4 py-3 text-sm text-foreground focus:outline-none focus:border-accent"
            required
          />
        </div>

        {error && <p className="text-xs text-danger">{error}</p>}

        <Button type="submit" variant="primary" disabled={loading} className="w-full text-xs tracking-widest uppercase py-3">
          {loading ? "Salvando..." : "Alterar Senha"}
        </Button>
      </form>
    </div>
  );
}
