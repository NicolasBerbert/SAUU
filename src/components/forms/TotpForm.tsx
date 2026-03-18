"use client";

import { useState, useRef } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface Props {
  pendingToken: string;
}

export function TotpForm({ pendingToken }: Props) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const totpCode = code.replace(/\D/g, "");
    if (totpCode.length !== 6) {
      setError("O código deve ter 6 dígitos.");
      return;
    }

    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      pendingToken,
      totpCode,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Código inválido ou expirado. Tente novamente.");
      setCode("");
      inputRef.current?.focus();
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label className="text-xs uppercase tracking-widest text-muted block mb-2">
          Código de 6 dígitos
        </label>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          autoFocus
          autoComplete="one-time-code"
          className="w-full bg-transparent border border-border px-3 py-2 text-lg text-primary text-center tracking-[0.5em] placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      {error && (
        <p className="text-xs text-danger border border-danger/20 bg-danger/5 px-4 py-3">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="mt-2 py-4 text-xs tracking-widest uppercase">
        Verificar
      </Button>
    </form>
  );
}
