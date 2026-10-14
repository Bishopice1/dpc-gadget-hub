import { createServiceClient } from "@/lib/supabase/service";
import { isAdminEmail } from "@/lib/validation/auth";

/**
 * Ensures the signed-in user's email exists in public.admin_emails when it is
 * listed in the ADMIN_EMAILS env var (and removes it when it is not).
 * Keeps the database RLS admin list in sync with the env configuration.
 * Best-effort: callers must treat failures as non-fatal.
 */
export async function syncAdminEmail(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  const supabase = createServiceClient();
  const shouldAdmin = isAdminEmail(normalized);

  if (shouldAdmin) {
    const { error } = await supabase
      .from("admin_emails")
      .upsert({ email: normalized }, { onConflict: "email", ignoreDuplicates: false });
    if (error) throw new Error(`admin_emails upsert failed: ${error.message}`);
  } else {
    const { error } = await supabase
      .from("admin_emails")
      .delete()
      .eq("email", normalized);
    if (error) throw new Error(`admin_emails delete failed: ${error.message}`);
  }
}