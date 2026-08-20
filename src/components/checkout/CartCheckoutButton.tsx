"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

export function CartCheckoutButton() {
  const { cart, isEmpty, subtotal, limparCarrinho } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    if (isEmpty) return;
    setLoading(true);
    setError(null);

    const payload = {
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
      })),
    };

    try {
      const res = await fetch("/api/pedidos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao processar o pagamento.");
        setLoading(false);
        return;
      }

      limparCarrinho();
      // Redireciona para o checkout do Stripe (cartão)
      window.location.href = data.checkoutUrl;
    } catch {
      setError("Erro de conexão. Tente novamente.");
      setLoading(false);
    }
  }

  if (isEmpty) {
    return (
      <Button variant="primary" disabled className="w-full text-xs tracking-widest uppercase py-3 opacity-40">
        Carrinho vazio
      </Button>
    );
  }

  return (
    <div>
      {error && <p className="text-xs text-danger mb-4">{error}</p>}
      <Button
        variant="primary"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full text-xs tracking-widest uppercase py-3"
      >
        {loading
          ? "Processando..."
          : `Pagar com cartão — ${formatCurrency(subtotal)}`}
      </Button>
      <p className="mt-3 text-center text-[11px] text-muted">
        Pagamento por cartão via Stripe. A inscrição no evento é paga à parte, via PIX.
      </p>
    </div>
  );
}
