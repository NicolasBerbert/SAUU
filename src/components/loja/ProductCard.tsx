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
    <div className="bg-surface flex flex-col group">
      {/* Imagem */}
      <div className="aspect-square bg-surface-2 overflow-hidden relative">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg className="w-12 h-12 text-border" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
            </svg>
          </div>
        )}
        {esgotado && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <span className="text-xs uppercase tracking-widest text-muted">Esgotado</span>
          </div>
        )}
        {qtdNoCarrinho > 0 && (
          <div className="absolute top-2 right-2 bg-accent text-background text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {qtdNoCarrinho}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <p className="text-sm text-primary mb-1">{name}</p>
          {description && (
            <p className="text-xs text-muted line-clamp-2">{description}</p>
          )}
        </div>
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-base text-accent">{formatCurrency(price)}</span>
          {!esgotado && (
            <span className="text-[10px] uppercase tracking-widest text-muted">
              {stock} disponíveis
            </span>
          )}
          {esgotado && (
            <span className="text-[10px] uppercase tracking-widest text-danger">Esgotado</span>
          )}
        </div>

        {/* Ações do carrinho */}
        {!esgotado && (
          <div className="flex gap-2">
            {qtdNoCarrinho === 0 ? (
              <button
                onClick={handleAdicionar}
                className="flex-1 border border-accent text-accent text-[10px] uppercase tracking-widest py-2 hover:bg-accent hover:text-background transition-colors"
              >
                Adicionar
              </button>
            ) : (
              <>
                <button
                  onClick={handleRemover}
                  className="border border-border text-muted text-[10px] uppercase tracking-widest px-3 py-2 hover:border-danger hover:text-danger transition-colors"
                >
                  Remover
                </button>
                <button
                  onClick={handleAdicionar}
                  disabled={limiteAtingido}
                  className="flex-1 border border-accent text-accent text-[10px] uppercase tracking-widest py-2 hover:bg-accent hover:text-background transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {limiteAtingido ? "Máximo" : `Adicionar mais`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
