// Tipos e helpers para o carrinho de compras.
// O carrinho é gerenciado em memória (React Context) e persistido no localStorage.
// Não há carrinho no banco de dados — é inteiramente client-side.

export interface CartItem {
  productId: string;
  name: string;
  price: number;   // valor unitário em reais
  quantity: number;
  stock: number;   // estoque atual — usado para limitar adição
  imageUrl?: string | null;
}

export interface Cart {
  items: CartItem[];
  incluirInscricao: boolean; // true = inscrição no evento está no carrinho
}

export const CART_EMPTY: Cart = {
  items: [],
  incluirInscricao: false,
};

const STORAGE_KEY = "sauu_cart";

// ─── Persistência ─────────────────────────────────────────────────────────

export function loadCart(): Cart {
  if (typeof window === "undefined") return CART_EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CART_EMPTY;
    const parsed = JSON.parse(raw) as Cart;
    // Valida estrutura mínima para evitar crashes com dados corrompidos
    if (!Array.isArray(parsed.items)) return CART_EMPTY;
    return parsed;
  } catch {
    return CART_EMPTY;
  }
}

export function saveCart(cart: Cart): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch {
    // localStorage pode estar desabilitado (modo privado restrito, etc.)
  }
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Operações puras (retornam novo estado, não mutam) ────────────────────

export function addItem(cart: Cart, item: Omit<CartItem, "quantity">): Cart {
  const existing = cart.items.find((i) => i.productId === item.productId);

  if (existing) {
    // Incrementa, respeitando o estoque disponível
    const novaQtd = Math.min(existing.quantity + 1, item.stock);
    if (novaQtd === existing.quantity) return cart; // já no máximo
    return {
      ...cart,
      items: cart.items.map((i) =>
        i.productId === item.productId ? { ...i, quantity: novaQtd } : i
      ),
    };
  }

  if (item.stock === 0) return cart; // sem estoque

  return {
    ...cart,
    items: [...cart.items, { ...item, quantity: 1 }],
  };
}

export function removeItem(cart: Cart, productId: string): Cart {
  return {
    ...cart,
    items: cart.items.filter((i) => i.productId !== productId),
  };
}

export function updateQuantity(cart: Cart, productId: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, productId);

  return {
    ...cart,
    items: cart.items.map((i) => {
      if (i.productId !== productId) return i;
      return { ...i, quantity: Math.min(quantity, i.stock) };
    }),
  };
}

export function setInscricao(cart: Cart, incluir: boolean): Cart {
  return { ...cart, incluirInscricao: incluir };
}

// ─── Totalizadores ────────────────────────────────────────────────────────

export function cartItemCount(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.quantity, 0);
}

export function cartSubtotal(cart: Cart): number {
  return cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartTotal(cart: Cart, precoInscricao: number): number {
  return cartSubtotal(cart) + (cart.incluirInscricao ? precoInscricao : 0);
}

export function cartIsEmpty(cart: Cart): boolean {
  return cart.items.length === 0 && !cart.incluirInscricao;
}
