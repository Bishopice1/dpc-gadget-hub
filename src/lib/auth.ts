import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/validation/auth";

export interface AuthContext {
  user: User;
  isAdmin: boolean;
}

/**
 * Returns the signed-in user or null. Use in Server Components / handlers.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user, isAdmin: isAdminEmail(user.email) };
}