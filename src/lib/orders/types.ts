import type { PaymentMethod } from "@/lib/validation/checkout";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export interface OrderItem {
  id: string;
  product_id: string | null;
  name: string;
  unit_price_ngn: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_method: PaymentMethod;
  total_ngn: number;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string | null;
  created_at: string;
  items: OrderItem[];
}

export interface CreateOrderLine {
  product_id: string;
  quantity: number;
}

export interface CreateOrderInput {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note?: string;
  payment_method: PaymentMethod;
  items: CreateOrderLine[];
}

/**
 * Generates an order number like DPC-261014-A1B2:
 * date part (YYMMDD) + 4 random unambiguous characters.
 */
export function generateOrderNumber(now: Date = new Date()): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let random = "";
  const bytes = new Uint8Array(4);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) random += alphabet[b % alphabet.length];
  } else {
    for (let i = 0; i < 4; i += 1) {
      random += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `DPC-${yy}${mm}${dd}-${random}`;
}
