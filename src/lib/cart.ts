// Cart types and pure helpers.
// Cart is managed in React Context and persisted in localStorage.

export interface CartItem {
  key: string;        // productId for no-size items; "productId:size" for sized items
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string | null;
  size?: string;
}

export interface Cart {
  items: CartItem[];
  incluirInscricao: boolean;
}

export const CART_EMPTY: Cart = {
  items: [],
  incluirInscricao: false,
};

const STORAGE_KEY = "sauu_cart";

export function makeCartKey(productId: string, size?: string): string {
  return size ? `${productId}:${size}` : productId;
}

// ─── Persistência ─────────────────────────────────────────────────────────

export function loadCart(): Cart {
  if (typeof window === "undefined") return CART_EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CART_EMPTY;
    const parsed = JSON.parse(raw) as Cart;
    if (!Array.isArray(parsed.items)) return CART_EMPTY;
    // Backfill key field for items saved before size support was added
    parsed.items = parsed.items.map((i) => ({
      ...i,
      key: i.key ?? makeCartKey(i.productId, i.size),
    }));
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
    // localStorage may be disabled (strict private mode, etc.)
  }
}

export function clearCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Operações puras ──────────────────────────────────────────────────────

export function addItem(cart: Cart, item: Omit<CartItem, "quantity" | "key">): Cart {
  const key = makeCartKey(item.productId, item.size);
  const existing = cart.items.find((i) => i.key === key);

  if (existing) {
    const novaQtd = Math.min(existing.quantity + 1, item.stock);
    if (novaQtd === existing.quantity) return cart;
    return {
      ...cart,
      items: cart.items.map((i) =>
        i.key === key ? { ...i, quantity: novaQtd } : i
      ),
    };
  }

  if (item.stock === 0) return cart;

  return {
    ...cart,
    items: [...cart.items, { ...item, key, quantity: 1 }],
  };
}

export function removeItem(cart: Cart, key: string): Cart {
  return {
    ...cart,
    items: cart.items.filter((i) => i.key !== key),
  };
}

export function updateQuantity(cart: Cart, key: string, quantity: number): Cart {
  if (quantity <= 0) return removeItem(cart, key);
  return {
    ...cart,
    items: cart.items.map((i) => {
      if (i.key !== key) return i;
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
