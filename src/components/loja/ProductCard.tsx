"use client";

import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

interface ProductCardProps {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock: number;
  imageUrl: string | null;
}

export function ProductCard({ id, name, description, price, stock, imageUrl }: ProductCardProps) {
  const { cart, addToCart, removeFromCart } = useCart();

  const itemNoCarrinho = cart.items.find((i) => i.productId === id);
  const qtdNoCarrinho = itemNoCarrinho?.quantity ?? 0;
  const esgotado = stock === 0;
  const limiteAtingido = qtdNoCarrinho >= stock;

  function handleAdicionar() {
    addToCart({ productId: id, name, price, stock, imageUrl });
  }

  function handleRemover() {
    removeFromCart(id);
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
        {qtdNoCarrinho > 0 && (
          <div
            className="absolute right-3 top-3 grid h-6 w-6 place-items-center rounded-full text-[12px] font-bold text-background"
            style={{ background: "var(--red)" }}
          >
            {qtdNoCarrinho}
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
                className="flex-1 py-2.5 text-[10px] uppercase tracking-[0.24em] text-primary transition-colors hover:bg-primary hover:text-background"
                style={{ border: "1px solid var(--ink)" }}
              >
                Adicionar
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
