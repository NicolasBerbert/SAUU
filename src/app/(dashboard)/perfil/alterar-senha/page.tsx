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
      <div className="mb-10">
        <div className="mb-4 flex items-center gap-3.5">
          <span className="h-px w-8" style={{ background: "var(--red)" }} />
          <span className="eyebrow">Perfil</span>
        </div>
        <h1
          className="mb-2 font-display leading-none text-primary"
          style={{ fontSize: "40px" }}
        >
          Alterar Senha
        </h1>
        <p className="text-[14px] text-muted">
          Escolha uma senha com ao menos 8 caracteres e um número.
        </p>
      </div>

      {success && (
        <div
          className="mb-8 px-4 py-3 text-[13px]"
          style={{
            border: "1px solid var(--sage)",
            color: "var(--sage)",
            background: "rgba(140,150,115,0.08)",
          }}
        >
          Senha alterada com sucesso. Faça login novamente na próxima sessão.
        </div>
      )}

      <form onSubmit={handleSubmit} className="max-w-sm space-y-6">
        {[
          { label: "Senha Atual", key: "currentPassword" as const },
          { label: "Nova Senha", key: "newPassword" as const },
          { label: "Confirmar Nova Senha", key: "confirmPassword" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label
              className="mb-2 block text-[10.5px] uppercase tracking-[0.26em] text-muted"
            >
              {label}
            </label>
            <input
              type="password"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              className="w-full border-0 border-b bg-transparent px-0 py-[14px] text-[15px] text-primary outline-none transition-colors focus:border-accent"
              style={{ borderBottom: "1px solid var(--line)" }}
              required
            />
          </div>
        ))}

        {error && (
          <p className="text-[12px] text-danger">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          disabled={loading}
          className="w-full py-4"
        >
          {loading ? "Salvando..." : "Alterar Senha"}
        </Button>
      </form>
    </div>
  );
}
