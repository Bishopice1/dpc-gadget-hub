import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder } from "@/lib/orders/create";
import { checkoutSchema } from "@/lib/validation/checkout";

/**
 * POST /api/checkout — requires Google login (session cookie).
 * Validates with zod, then creates the order with the service role:
 * prices/totals recomputed from the DB, stock checked + decremented.
 * Phase 4 hooks email sending here (non-blocking, never rolls back).
 */
export async function POST(request: Request) {
  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json(
      { error: "Checkout is not configured yet. Please try again later." },
      { status: 503 },
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please sign in with Google to place your order." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Check your details and try again.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 400 },
    );
  }

  const result = await createOrder(user.id, {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    address: parsed.data.address,
    city: parsed.data.city,
    state: parsed.data.state,
    note: parsed.data.note,
    payment_method: parsed.data.payment_method,
    items: parsed.data.items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
    })),
  });

  if ("error" in result) {
    const status =
      result.error.code === "EMPTY_CART" ||
      result.error.code === "PRODUCT_NOT_FOUND" ||
      result.error.code === "OUT_OF_STOCK"
        ? 400
        : 500;
    return NextResponse.json(
      { error: result.error.message, code: result.error.code },
      { status },
    );
  }

  // TODO Phase 4: send order-confirmation + owner-notification emails here.
  // Must be fire-and-forget: log failures, never roll back the order.

  return NextResponse.json(
    { order_number: result.order.order_number },
    { status: 201 },
  );
}
