import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseNextPath } from "@/lib/validation/auth";
import { syncAdminEmail } from "@/lib/admin-sync";

/**
 * OAuth callback: exchanges the provider code for a Supabase session,
 * then redirects to the validated internal path (default "/").
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = parseNextPath(searchParams.get("next"));
  const providerError = searchParams.get("error");

  if (providerError) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Google sign-in was cancelled or denied.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Sign-in failed: missing authorization code.");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = await createClient().catch((err) => {
    console.error("[auth] callback unavailable (Supabase not configured):", err);
    return null;
  });
  if (!supabase) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set(
      "error",
      "Google sign-in is not configured yet. Add Supabase keys to .env.local first.",
    );
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth] exchangeCodeForSession failed:", error.message);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Sign-in failed. Please try again.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  // Keep the database admin list in sync with ADMIN_EMAILS (RLS writes).
  const email = data.user?.email;
  if (email) {
    try {
      await syncAdminEmail(email);
    } catch (err) {
      console.error("[auth] admin sync failed (non-fatal):", err);
    }
  }

  return NextResponse.redirect(new URL(next, origin));
}