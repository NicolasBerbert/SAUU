"use client";

import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

export function CartBar() {
  const { isEmpty, itemCount, subtotal } = useCart();

  if (isEmpty) return null;

  const totalFinal = subtotal;

  return (
    <div
      className="fixed bottom-6 left-8 right-8 z-50 flex items-center justify-between px-6 py-4 shadow-2xl"
      style={{
        background: "var(--ink)",
        color: "var(--bg)",
        animation: "modalIn 0.35s cubic-bezier(0.2,0.7,0.2,1)",
      }}
    >
      <span
        className="text-[12px] uppercase tracking-[0.24em]"
        style={{ opacity: 0.7 }}
      >
        {itemCount} {itemCount === 1 ? "item" : "itens"} · retirada no evento
      </span>
      <div className="flex items-center gap-4">
        <span
          className="font-display text-[28px]"
          style={{ color: "var(--bg)" }}
        >
          {formatCurrency(totalFinal)}
        </span>
        <Link
          href="/checkout"
          className="inline-flex items-center gap-2 px-4 py-2.5 text-[10.5px] uppercase tracking-[0.24em] transition-all"
          style={{ background: "var(--bg)", color: "var(--red)" }}
        >
          Ver carrinho <span>→</span>
        </Link>
      </div>
    </div>
  );
}
