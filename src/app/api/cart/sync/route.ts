import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cartSyncSchema } from "@/lib/validation/cart";

/**
 * POST /api/cart/sync — full-replace sync of the signed-in user's cart.
 * Guests (no session) get { synced: false } so the localStorage cart keeps
 * working offline. Logged-in users get their cart mirrored to carts /
 * cart_items (RLS: owners only), which enables cross-device carts.
 * Invalid product ids are silently dropped; quantities are clamped by zod.
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = cartSyncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid cart." },
      { status: 400 },
    );
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch {
    return NextResponse.json({ synced: false, reason: "unconfigured" });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ synced: false, reason: "guest" });

  const wanted = parsed.data.items;

  // Ensure a cart row exists for this user.
  const existing = await supabase
    .from("carts")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  let cartId = (existing.data as { id: string } | null)?.id;
  if (!cartId) {
    const created = await supabase
      .from("carts")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (created.error || !created.data) {
      console.error("[cart/sync] cart create failed:", created.error?.message);
      return NextResponse.json(
        { error: "Could not sync cart. Please try again." },
        { status: 500 },
      );
    }
    cartId = (created.data as { id: string }).id;
  }

  if (wanted.length === 0) {
    const cleared = await supabase
      .from("cart_items")
      .delete()
      .eq("cart_id", cartId);
    if (cleared.error) {
      console.error("[cart/sync] clear failed:", cleared.error.message);
    }
    return NextResponse.json({ synced: true, lines: 0 });
  }

  // Drop ids that no longer exist (products may be deleted by an admin).
  const validIds = await supabase
    .from("products")
    .select("id")
    .in(
      "id",
      wanted.map((i) => i.product_id),
    );
  const live = new Set(((validIds.data ?? []) as { id: string }[]).map((p) => p.id));
  const lines = wanted.filter((i) => live.has(i.product_id));

  const upserted = await supabase.from("cart_items").upsert(
    lines.map((i) => ({
      cart_id: cartId,
      product_id: i.product_id,
      quantity: i.quantity,
    })),
    { onConflict: "cart_id,product_id" },
  );
  if (upserted.error) {
    console.error("[cart/sync] upsert failed:", upserted.error.message);
    return NextResponse.json(
      { error: "Could not sync cart. Please try again." },
      { status: 500 },
    );
  }

  // Remove lines the client no longer has (full-replace semantics).
  const keptIds = lines.map((i) => i.product_id);
  const pruned = keptIds.length
    ? await supabase
        .from("cart_items")
        .delete()
        .eq("cart_id", cartId)
        .not("product_id", "in", `(${keptIds.join(",")})`)
    : await supabase.from("cart_items").delete().eq("cart_id", cartId);
  if (pruned.error) {
    console.error("[cart/sync] prune failed:", pruned.error.message);
  }

  return NextResponse.json({ synced: true, lines: lines.length });
}
