"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useCallback,
  type ReactNode,
} from "react";
import {
  type Cart,
  type CartItem,
  CART_EMPTY,
  loadCart,
  saveCart,
  clearCart,
  addItem,
  removeItem,
  updateQuantity,
  setInscricao,
  cartItemCount,
  cartSubtotal,
  cartTotal,
  cartIsEmpty,
} from "@/lib/cart";

// ─── Reducer ──────────────────────────────────────────────────────────────

type Action =
  | { type: "LOAD"; cart: Cart }
  | { type: "ADD_ITEM"; item: Omit<CartItem, "quantity" | "key"> }
  | { type: "REMOVE_ITEM"; key: string }
  | { type: "UPDATE_QTY"; key: string; quantity: number }
  | { type: "SET_INSCRICAO"; incluir: boolean }
  | { type: "CLEAR" };

function cartReducer(state: Cart, action: Action): Cart {
  switch (action.type) {
    case "LOAD":        return action.cart;
    case "ADD_ITEM":    return addItem(state, action.item);
    case "REMOVE_ITEM": return removeItem(state, action.key);
    case "UPDATE_QTY":  return updateQuantity(state, action.key, action.quantity);
    case "SET_INSCRICAO": return setInscricao(state, action.incluir);
    case "CLEAR":       return CART_EMPTY;
    default:            return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: Cart;
  itemCount: number;
  subtotal: number;
  total: (precoInscricao: number) => number;
  isEmpty: boolean;
  addToCart: (item: Omit<CartItem, "quantity" | "key">) => void;
  removeFromCart: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  toggleInscricao: (incluir: boolean) => void;
  limparCarrinho: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, dispatch] = useReducer(cartReducer, CART_EMPTY);

  // Carrega do localStorage apenas no cliente
  useEffect(() => {
    dispatch({ type: "LOAD", cart: loadCart() });
  }, []);

  // Persiste no localStorage a cada mudança
  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  const addToCart = useCallback((item: Omit<CartItem, "quantity" | "key">) => {
    dispatch({ type: "ADD_ITEM", item });
  }, []);

  const removeFromCart = useCallback((key: string) => {
    dispatch({ type: "REMOVE_ITEM", key });
  }, []);

  const setQuantity = useCallback((key: string, quantity: number) => {
    dispatch({ type: "UPDATE_QTY", key, quantity });
  }, []);

  const toggleInscricao = useCallback((incluir: boolean) => {
    dispatch({ type: "SET_INSCRICAO", incluir });
  }, []);

  const limparCarrinho = useCallback(() => {
    dispatch({ type: "CLEAR" });
    clearCart();
  }, []);

  const value: CartContextValue = {
    cart,
    itemCount: cartItemCount(cart),
    subtotal: cartSubtotal(cart),
    total: (precoInscricao: number) => cartTotal(cart, precoInscricao),
    isEmpty: cartIsEmpty(cart),
    addToCart,
    removeFromCart,
    setQuantity,
    toggleInscricao,
    limparCarrinho,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>");
  return ctx;
}
