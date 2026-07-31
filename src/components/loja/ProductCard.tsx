"use client";

import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { makeCartKey } from "@/lib/cart";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
  sizes?: string | null; // comma-separated e.g. "P,M,G,GG"
}

export function ProductCard({ id, name, description, price, stock, imageUrl, sizes }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useCart();
  const sizeList = sizes ? sizes.split(",").map((s) => s.trim()).filter(Boolean) : [];
  const hasSizes = sizeList.length > 0;

  const [selectedSize, setSelectedSize] = useState<string>(hasSizes ? "" : "__none__");

  const cartKey = selectedSize && selectedSize !== "__none__"
    ? makeCartKey(id, selectedSize)
    : makeCartKey(id);

  const itemNoCarrinho = cart.items.find((i) => i.key === cartKey);
  const qtdNoCarrinho = itemNoCarrinho?.quantity ?? 0;

  // Count total in cart across all sizes to show badge
  const totalNoCarrinho = cart.items
    .filter((i) => i.productId === id)
    .reduce((sum, i) => sum + i.quantity, 0);

  const esgotado = stock === 0;
  const limiteAtingido = qtdNoCarrinho >= stock;
  const podeAdicionar = !esgotado && (!hasSizes || selectedSize !== "");

  function handleAdicionar() {
    if (hasSizes && !selectedSize) return;
    addToCart({ productId: id, name, price, stock, imageUrl, size: hasSizes ? selectedSize : undefined });
  }

  function handleRemover() {
    removeFromCart(cartKey);
  }

  return (
    <div
      className="group flex flex-col transition-colors"
      style={{ background: "var(--paper)" }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "var(--bg)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.background = "var(--paper)")
      }
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ background: "var(--paper-2)" }}
      >
        {imageUrl ? (
          // URL externa (Supabase Storage); next/image exigiria remotePatterns.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06] group-hover:-rotate-[2deg]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span
              className="font-display text-[64px]"
              style={{ color: "var(--muted)" }}
            >
              CLBB
            </span>
          </div>
        )}
        {esgotado && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(227,226,222,0.7)" }}
          >
            <span
              className="text-[11px] uppercase tracking-[0.28em]"
              style={{ color: "var(--muted)" }}
            >
              Esgotado
            </span>
          </div>
        )}
        {totalNoCarrinho > 0 && (
          <div
            className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold text-background"
            style={{ background: "var(--red)" }}
          >
            {totalNoCarrinho}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-3.5 p-5">
        <div className="flex-1">
          <h3
            className="mb-1 font-display text-[24px] leading-none text-primary"
          >
            {name}
          </h3>
          {description && (
            <p className="line-clamp-2 text-[13px] leading-[1.5] text-muted">
              {description}
            </p>
          )}
        </div>

        {/* Size picker */}
        {hasSizes && !esgotado && (
          <div>
            <p className="mb-2 text-[10px] uppercase tracking-[0.24em] text-muted">Tamanho</p>
            <div className="flex flex-wrap gap-1.5">
              {sizeList.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s === selectedSize ? "" : s)}
                  className="px-3 py-1.5 text-[11px] uppercase tracking-widest transition-colors"
                  style={{
                    border: "1px solid",
                    borderColor: selectedSize === s ? "var(--ink)" : "var(--line)",
                    background: selectedSize === s ? "var(--ink)" : "transparent",
                    color: selectedSize === s ? "var(--bg)" : "var(--muted)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: "var(--line)" }}
        >
          <span
            className="font-display text-[28px]"
            style={{ color: "var(--red)" }}
          >
            {formatCurrency(price)}
          </span>
          {!esgotado && (
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted">
              {stock} disponíveis
            </span>
          )}
        </div>

        {/* Cart actions */}
        {!esgotado && (
          <div className="flex gap-2">
            {qtdNoCarrinho === 0 ? (
              <button
                onClick={handleAdicionar}
                disabled={hasSizes && !selectedSize}
                className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.24em] text-primary transition-colors hover:bg-primary hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
                style={{ border: "1px solid var(--ink)" }}
              >
                {hasSizes && !selectedSize ? "Escolha o tamanho" : "Adicionar"}
              </button>
            ) : (
              <>
                <button
                  onClick={handleRemover}
                  className="px-3 py-2.5 text-[10px] uppercase tracking-[0.24em] text-muted transition-colors hover:border-accent hover:text-accent"
                  style={{ border: "1px solid var(--line)" }}
                >
                  Remover
                </button>
                <button
                  onClick={handleAdicionar}
                  disabled={limiteAtingido}
                  className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.24em] text-primary transition-colors hover:bg-primary hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ border: "1px solid var(--ink)" }}
                >
                  {limiteAtingido ? "Máximo" : "Adicionar mais"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
