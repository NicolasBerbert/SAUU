"use client";

import { useCart } from "@/contexts/CartContext";
import { formatCurrency } from "@/lib/utils";

interface CartSummaryProps {
  precoInscricao: number;
  inscricaoJaAprovada: boolean;
  userName: string;
  userEmail: string;
}

export function CartSummary({
  precoInscricao,
  inscricaoJaAprovada,
  userName,
  userEmail,
}: CartSummaryProps) {
  const { cart, removeFromCart, setQuantity, toggleInscricao, isEmpty, total } = useCart();

  const totalFinal = total(precoInscricao);

  return (
    <div className="space-y-6">
      {/* Inscrição no evento */}
      {!inscricaoJaAprovada && (
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">Inscrição no Evento</p>
          </div>
          <div className="px-6 py-5">
            <label className="flex items-center justify-between gap-4 cursor-pointer">
              <div>
                <p className="text-sm text-primary mb-0.5">SAUU + SEC</p>
                <p className="text-xs text-muted">Acesso completo: 5 dias de palestras</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm text-accent">{formatCurrency(precoInscricao)}</span>
                <input
                  type="checkbox"
                  checked={cart.incluirInscricao}
                  onChange={(e) => toggleInscricao(e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                />
              </div>
            </label>
          </div>
        </div>
      )}

      {inscricaoJaAprovada && (
        <div className="border border-border px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-primary mb-0.5">Inscrição no Evento</p>
            <p className="text-xs text-muted">Já confirmada</p>
          </div>
          <span className="text-xs uppercase tracking-widest text-success">Pago</span>
        </div>
      )}

      {/* Itens da loja */}
      {cart.items.length > 0 && (
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-surface">
            <p className="text-xs uppercase tracking-widest text-muted">Produtos</p>
          </div>
          <div className="divide-y divide-border">
            {cart.items.map((item) => (
              <div key={item.key} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary truncate">{item.name}</p>
                  <p className="text-xs text-muted">
                    {item.size && <span className="mr-2 uppercase">Tam: {item.size}</span>}
                    {formatCurrency(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center border border-border">
                    <button
                      onClick={() => setQuantity(item.key, item.quantity - 1)}
                      className="px-2 py-1 text-xs text-muted hover:text-primary transition-colors"
                      aria-label="Diminuir quantidade"
                    >
                      −
                    </button>
                    <span className="px-2 text-xs text-primary w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => setQuantity(item.key, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="px-2 py-1 text-xs text-muted hover:text-primary transition-colors disabled:opacity-40"
                      aria-label="Aumentar quantidade"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-primary w-20 text-right">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                  <button
                    onClick={() => removeFromCart(item.key)}
                    className="text-muted hover:text-danger transition-colors text-xs"
                    aria-label="Remover"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carrinho vazio */}
      {isEmpty && !inscricaoJaAprovada && (
        <div className="border border-border py-10 text-center">
          <p className="text-sm text-muted">Seu carrinho está vazio.</p>
          <p className="text-xs text-muted/60 mt-1">
            Adicione produtos na loja ou marque a inscrição no evento acima.
          </p>
        </div>
      )}

      {/* Total */}
      {!isEmpty && (
        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-surface flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-muted">Total</p>
            <p className="text-base text-accent">{formatCurrency(totalFinal)}</p>
          </div>
          <div className="px-6 py-4 flex items-center justify-between">
            <p className="text-xs text-muted">Participante</p>
            <p className="text-xs text-primary">{userName} · {userEmail}</p>
          </div>
        </div>
      )}
    </div>
  );
}
