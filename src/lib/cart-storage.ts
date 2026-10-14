/**
 * Guest cart persistence (localStorage). Phase 3 adds database sync for
 * signed-in users on top of these primitives. Prices stored here are for
 * display only — the server always recomputes totals from the database.
 */

export interface StoredCartItem {
  product_id: string;
  slug: string;
  name: string;
  price_ngn: number;
  image_url: string;
  quantity: number;
  stock: number;
}

export const CART_STORAGE_KEY = "dpc_cart_v1";
export const CART_CHANGE_EVENT = "dpc:cart-updated";
const MAX_QUANTITY_PER_LINE = 99;

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readCart(): StoredCartItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is StoredCartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as StoredCartItem).product_id === "string" &&
        typeof (item as StoredCartItem).quantity === "number",
    );
  } catch {
    return [];
  }
}

function writeCart(items: StoredCartItem[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event(CART_CHANGE_EVENT));
  } catch {
    // Storage full or blocked — cart stays in memory for this page view.
  }
}

export function addToCart(
  item: Omit<StoredCartItem, "quantity">,
  quantity = 1,
): StoredCartItem[] {
  const items = readCart();
  const existing = items.find((i) => i.product_id === item.product_id);
  const stockCap = Math.max(0, item.stock);

  if (existing) {
    existing.quantity = Math.min(
      existing.quantity + Math.max(1, quantity),
      stockCap,
      MAX_QUANTITY_PER_LINE,
    );
    existing.price_ngn = item.price_ngn;
    existing.stock = item.stock;
    existing.name = item.name;
    existing.image_url = item.image_url;
  } else {
    items.push({
      ...item,
      quantity: Math.min(Math.max(1, quantity), stockCap, MAX_QUANTITY_PER_LINE),
    });
  }

  const next = items.filter((i) => i.quantity > 0);
  writeCart(next);
  return next;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
): StoredCartItem[] {
  const items = readCart();
  for (const item of items) {
    if (item.product_id === productId) {
      if (quantity <= 0) {
        item.quantity = 0;
      } else {
        item.quantity = Math.min(
          Math.floor(quantity),
          item.stock,
          MAX_QUANTITY_PER_LINE,
        );
      }
    }
  }
  const next = items.filter((i) => i.quantity > 0);
  writeCart(next);
  return next;
}

export function removeFromCart(productId: string): StoredCartItem[] {
  const next = readCart().filter((i) => i.product_id !== productId);
  writeCart(next);
  return next;
}

export function clearCart(): void {
  writeCart([]);
}

export function getCartCount(): number {
  return readCart().reduce((total, item) => total + item.quantity, 0);
}

export function getCartSubtotal(): number {
  return readCart().reduce(
    (total, item) => total + item.price_ngn * item.quantity,
    0,
  );
}