"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

export function RedefinirSenhaForm({ token }: { token: string }) {
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.newPassword !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (form.newPassword.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }
    if (!/[0-9]/.test(form.newPassword)) {
      setError("A senha deve conter ao menos um número.");
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/auth/redefinir-senha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Erro ao redefinir a senha.");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div>
        <div
          className="mb-6 px-4 py-3 text-[13px]"
          style={{ color: "var(--sage)", border: "1px solid var(--sage)", background: "rgba(140,150,115,0.08)" }}
        >
          Senha redefinida com sucesso! Agora você já pode entrar com a nova senha.
        </div>
        <Link href="/login">
          <Button className="w-full py-4 text-xs tracking-widest uppercase">Ir para o login</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <div>
        <Label htmlFor="newPassword">Nova senha</Label>
        <Input
          id="newPassword"
          type="password"
          placeholder="Mínimo 8 caracteres, com um número"
          autoComplete="new-password"
          required
          value={form.newPassword}
          onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
        />
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Repita a senha"
          autoComplete="new-password"
          required
          value={form.confirmPassword}
          onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))}
        />
      </div>

      {error && (
        <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">{error}</p>
      )}

      <Button type="submit" loading={status === "loading"} className="mt-2 py-4 text-xs tracking-widest uppercase">
        Redefinir senha
      </Button>
    </form>
  );
}
