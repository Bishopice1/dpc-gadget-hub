"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  addToCart as persistAdd,
  clearCart as persistClear,
  readCart,
  removeFromCart as persistRemove,
  updateCartQuantity as persistUpdate,
  CART_CHANGE_EVENT,
  type StoredCartItem,
} from "@/lib/cart-storage";

/**
 * App-wide cart state. Guests persist to localStorage; when a user is
 * signed in the cart is mirrored to the database via /api/cart/sync
 * (debounced, best-effort — the local cart is always the source of truth
 * for rendering so the UI never blocks on the network).
 */
interface AddPayload {
  product_id: string;
  slug: string;
  name: string;
  price_ngn: number;
  image_url: string;
  stock: number;
}

interface CartContextValue {
  items: StoredCartItem[];
  count: number;
  subtotal: number;
  hydrated: boolean;
  addItem: (item: AddPayload, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function snapshot(): StoredCartItem[] {
  return readCart();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<StoredCartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage after mount (avoids SSR mismatch).
  useEffect(() => {
    setItems(snapshot());
    setHydrated(true);
  }, []);

  // Keep every tab / component in sync through the storage event.
  useEffect(() => {
    const refresh = () => setItems(snapshot());
    window.addEventListener(CART_CHANGE_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CART_CHANGE_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Mirror to the database for signed-in users (debounced, silent).
  useEffect(() => {
    if (!hydrated) return;
    const timer = setTimeout(() => {
      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      }).catch(() => {
        /* offline or signed out — local cart still works */
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [items, hydrated]);

  const addItem = useCallback((item: AddPayload, quantity = 1) => {
    setItems(persistAdd(item, quantity));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      setItems(persistUpdate(productId, quantity));
    },
    [],
  );

  const removeItem = useCallback((productId: string) => {
    setItems(persistRemove(productId));
  }, []);

  const clear = useCallback(() => {
    persistClear();
    setItems([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((t, i) => t + i.quantity, 0);
    const subtotal = items.reduce(
      (t, i) => t + i.price_ngn * i.quantity,
      0,
    );
    return {
      items,
      count,
      subtotal,
      hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    };
  }, [items, hydrated, addItem, updateQuantity, removeItem, clear]);

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
