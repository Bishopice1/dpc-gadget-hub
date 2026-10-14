import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. Bypasses RLS — used ONLY inside trusted server code
 * (order creation, admin operations). Importing this from a Client Component
 * is a build error because the key never reaches the browser: Next.js only
 * inlines NEXT_PUBLIC_* vars, and this reads SUPABASE_SERVICE_ROLE_KEY.
 */
export function createServiceClient(): SupabaseClient {
  if (typeof window !== "undefined") {
    throw new Error(
      "createServiceClient() must never run in the browser (service role key).",
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (server-only env vars).",
    );
  }

  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}