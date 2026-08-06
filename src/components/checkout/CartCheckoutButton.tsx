"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";

const IS_DEV = process.env.NODE_ENV === "development";

interface CartCheckoutButtonProps {
  precoInscricao: number;
}

export function CartCheckoutButton({ precoInscricao }: CartCheckoutButtonProps) {
  const router = useRouter();
  const { cart, isEmpty, total, limparCarrinho } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalFinal = total(precoInscricao);

  async function handleCheckout() {
    if (isEmpty) return;
    setLoading(true);
    setError(null);

    const payload = {
      incluirInscricao: cart.incluirInscricao,
      items: cart.items.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
        size: i.size,
      })),
    };

    try {
      // Em desenvolvimento, usa o simulador — sem chamada ao Mercado Pago
      const rota = IS_DEV ? "/api/checkout/simular" : "/api/checkout";

      const res = await fetch(rota, {
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

      if (IS_DEV) {
        // Simulador aprova direto — vai para sucesso
        router.push("/checkout/sucesso");
      } else {
        // Produção — redireciona para o Mercado Pago
        window.location.href = data.checkoutUrl;
      }
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
      {IS_DEV && (
        <div className="border border-accent/20 bg-accent/5 px-4 py-3 mb-4">
          <p className="text-xs text-accent/80">
            Ambiente de testes — nenhuma cobrança real será realizada.
          </p>
        </div>
      )}
      {error && <p className="text-xs text-danger mb-4">{error}</p>}
      <Button
        variant="primary"
        onClick={handleCheckout}
        disabled={loading}
        className="w-full text-xs tracking-widest uppercase py-3"
      >
        {loading
          ? "Processando..."
          : `Confirmar e Pagar — ${formatCurrency(totalFinal)}`}
      </Button>
    </div>
  );
}
