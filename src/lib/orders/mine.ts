import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/orders/types";

/**
 * Reads orders for the signed-in user (RLS: owners only).
 * Returns null when Supabase is not configured (local-data mode).
 */
export async function getMyOrders(): Promise<Order[] | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, status, payment_method, total_ngn, full_name, phone, address, city, state, note, created_at, order_items (id, product_id, name, unit_price_ngn, quantity)",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[orders] list failed:", error.message);
    throw new Error("Could not load your orders. Please try again.");
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    ...(row as unknown as Omit<Order, "items">),
    items: ((row.order_items ?? []) as Order["items"]),
  }));
}

/**
 * Reads a single order by order number, only if owned by the signed-in user.
 */
export async function getMyOrderByNumber(
  orderNumber: string,
): Promise<Order | null> {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("orders")
    .select(
      "id, order_number, user_id, status, payment_method, total_ngn, full_name, phone, address, city, state, note, created_at, order_items (id, product_id, name, unit_price_ngn, quantity)",
    )
    .eq("order_number", orderNumber)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[orders] fetch failed:", error.message);
    throw new Error("Could not load this order. Please try again.");
  }
  if (!data) return null;

  const row = data as Record<string, unknown>;
  return {
    ...(row as unknown as Omit<Order, "items">),
    items: ((row.order_items ?? []) as Order["items"]),
  };
}
