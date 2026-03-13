"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function CheckoutButton({ price }: { price: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pagamento/simular", { method: "POST" });
      if (!res.ok) throw new Error("Erro ao processar");
      router.push("/checkout/sucesso");
    } catch {
      setError("Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <p className="text-xs text-danger mb-4">{error}</p>
      )}
      <Button
        variant="primary"
        onClick={handleConfirm}
        disabled={loading}
        className="w-full text-xs tracking-widest uppercase py-3"
      >
        {loading ? "Processando..." : `Confirmar Inscrição — R$ ${price.toFixed(2).replace(".", ",")}`}
      </Button>
    </div>
  );
}
