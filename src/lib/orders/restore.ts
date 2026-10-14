import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns previously reserved stock to the shelves (best-effort).
 * Used when order creation fails after some stock was already decremented.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function restoreStock(
  supabase: SupabaseClient<any, "public", any>,
  reserved: { id: string; quantity: number }[],
): Promise<void> {
  for (const r of reserved) {
    try {
      const { data } = await supabase
        .from("products")
        .select("stock")
        .eq("id", r.id)
        .single();
      const current = (data as { stock: number } | null)?.stock ?? 0;
      await supabase
        .from("products")
        .update({ stock: current + r.quantity })
        .eq("id", r.id);
    } catch (err) {
      console.error("[orders] stock restore failed:", err);
    }
  }
}
