import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Read-only, cookie-less client for public catalogue reads (products).
 * Keeps product pages statically renderable — no session involved, RLS
 * "products_public_read" policy allows anon SELECT.
 */
export function createPublicClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null; // Not configured yet -> local fallback.

  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}