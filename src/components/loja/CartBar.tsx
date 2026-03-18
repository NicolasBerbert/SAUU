"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

// Barra flutuante que aparece na parte inferior da loja quando o carrinho tem itens.
export function CartBar({ precoInscricao }: { precoInscricao: number }) {
  const { isEmpty, itemCount, total, cart } = useCart();

  if (isEmpty) return null;

  const totalFinal = total(precoInscricao);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-accent/30 bg-background/95 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-widest text-muted">
            {itemCount} {itemCount === 1 ? "item" : "itens"}
            {cart.incluirInscricao && " + inscrição"}
          </span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm text-accent">{formatCurrency(totalFinal)}</span>
          <Link
            href="/checkout"
            className="border border-accent text-accent text-[10px] uppercase tracking-widest px-6 py-2.5 hover:bg-accent hover:text-background transition-colors"
          >
            Ver carrinho
          </Link>
        </div>
      </div>
    </div>
  );
}
