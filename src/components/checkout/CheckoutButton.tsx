"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function CheckoutButton({ price }: { price: number }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/pagamento/criar", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao iniciar pagamento");
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div>
      {error && <p className="text-xs text-danger mb-4">{error}</p>}
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
