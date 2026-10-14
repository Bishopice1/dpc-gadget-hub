import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseNextPath } from "@/lib/validation/auth";

/**
 * Starts the Google OAuth flow (Supabase Auth, PKCE).
 * Google redirects back to /auth/callback which exchanges the code.
 */
export async function GET(request: NextRequest) {
  const next = parseNextPath(request.nextUrl.searchParams.get("next"));

  const origin =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    request.nextUrl.origin;

  const supabase = await createClient().catch((err) => {
    // Local-data mode (no Supabase configured): explain instead of 500.
    console.error("[auth] Google sign-in unavailable:", err);
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

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("[auth] signInWithOAuth failed:", error.message);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", "Could not start Google sign-in. Please try again.");
    loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(data.url);
}