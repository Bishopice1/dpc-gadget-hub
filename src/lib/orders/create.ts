import { createServiceClient } from "@/lib/supabase/service";
import { restoreStock } from "@/lib/orders/restore";
import {
  generateOrderNumber,
  type CreateOrderInput,
  type Order,
} from "@/lib/orders/types";

export interface OrderCreationError {
  code: "EMPTY_CART" | "PRODUCT_NOT_FOUND" | "OUT_OF_STOCK" | "DB_ERROR";
  message: string;
}

interface ProductRow {
  id: string;
  name: string;
  price_ngn: number;
  stock: number;
}

type DbError = { message: string } | null;

/**
 * Creates an order server-side ONLY (service role bypasses RLS by design).
 *  - Prices/totals recomputed from products — client prices never trusted.
 *  - Missing products or insufficient stock fail the whole order.
 *  - Stock decremented with a per-row guard (update where stock >= qty)
 *    so concurrent checkouts cannot oversell; failures restore reservations.
 * Phase 4 sends emails after this returns (non-blocking, never rolls back).
 */
export async function createOrder(
  userId: string,
  input: CreateOrderInput,
): Promise<{ order: Order } | { error: OrderCreationError }> {
  if (input.items.length === 0) {
    return { error: { code: "EMPTY_CART", message: "Your cart is empty." } };
  }

  const supabase = createServiceClient();
  const productIds = [...new Set(input.items.map((i) => i.product_id))];

  const fetched = await supabase
    .from("products")
    .select("id, name, price_ngn, stock")
    .in("id", productIds);
  const fetchError = fetched.error as DbError;
  if (fetchError) {
    console.error("[orders] product fetch failed:", fetchError.message);
    return { error: { code: "DB_ERROR", message: "Please try again." } };
  }
  const rows = (fetched.data ?? []) as ProductRow[];
  const byId = new Map(rows.map((p) => [p.id, p]));

  for (const line of input.items) {
    const product = byId.get(line.product_id);
    if (!product) {
      return {
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: "An item in your cart is no longer available.",
        },
      };
    }
    if (product.stock < line.quantity) {
      return {
        error: {
          code: "OUT_OF_STOCK",
          message:
            product.stock <= 0
              ? `"${product.name}" is out of stock.`
              : `Only ${product.stock} of "${product.name}" left in stock.`,
        },
      };
    }
  }

  // Reserve stock first (atomic per-row guard against overselling).
  const reserved: { id: string; quantity: number }[] = [];
  for (const line of input.items) {
    const product = byId.get(line.product_id);
    if (!product) continue;
    const updated = await supabase
      .from("products")
      .update({ stock: product.stock - line.quantity })
      .eq("id", product.id)
      .gte("stock", line.quantity)
      .select("id");
    const conflict = updated.error as DbError;
    const taken = (updated.data ?? []) as { id: string }[];
    if (conflict || taken.length === 0) {
      await restoreStock(supabase, reserved);
      return {
        error: {
          code: "OUT_OF_STOCK",
          message: `"${product.name}" just sold out. Adjust your cart and try again.`,
        },
      };
    }
    reserved.push({ id: product.id, quantity: line.quantity });
  }

  const lines = input.items.map((line) => {
    const product = byId.get(line.product_id);
    if (!product) throw new Error("product vanished after reservation");
    return {
      product_id: product.id,
      name: product.name,
      unit_price_ngn: product.price_ngn,
      quantity: line.quantity,
    };
  });
  const total_ngn = lines.reduce(
    (sum, l) => sum + l.unit_price_ngn * l.quantity,
    0,
  );

  let orderNumber = generateOrderNumber();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const check = await supabase
      .from("orders")
      .select("id")
      .eq("order_number", orderNumber)
      .maybeSingle();
    if (!check.data) break;
    orderNumber = generateOrderNumber();
  }

  const inserted = await supabase
    .from("orders")
    .insert({
      order_number: orderNumber,
      user_id: userId,
      status: "pending",
      payment_method: input.payment_method,
      total_ngn,
      full_name: input.full_name,
      phone: input.phone,
      address: input.address,
      city: input.city,
      state: input.state,
      note: input.note ?? null,
    })
    .select(
      "id, order_number, user_id, status, payment_method, total_ngn, full_name, phone, address, city, state, note, created_at",
    )
    .single();
  const orderError = inserted.error as DbError;
  if (orderError || !inserted.data) {
    console.error("[orders] order insert failed:", orderError?.message);
    await restoreStock(supabase, reserved);
    return { error: { code: "DB_ERROR", message: "Please try again." } };
  }

  const orderId = (inserted.data as { id: string }).id;
  const itemsInserted = await supabase.from("order_items").insert(
    lines.map((l) => ({
      order_id: orderId,
      product_id: l.product_id,
      name: l.name,
      unit_price_ngn: l.unit_price_ngn,
      quantity: l.quantity,
    })),
  );
  const itemsError = itemsInserted.error as DbError;
  if (itemsError) {
    console.error("[orders] order_items insert failed:", itemsError.message);
    await supabase.from("orders").delete().eq("id", orderId);
    await restoreStock(supabase, reserved);
    return { error: { code: "DB_ERROR", message: "Please try again." } };
  }

  const full = await supabase
    .from("order_items")
    .select("id, product_id, name, unit_price_ngn, quantity")
    .eq("order_id", orderId);
  const items = ((full.data ?? []) as Order["items"]);

  return {
    order: { ...(inserted.data as Omit<Order, "items">), items },
  };
}
