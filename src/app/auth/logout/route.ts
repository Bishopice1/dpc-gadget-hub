import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parseNextPath } from "@/lib/validation/auth";

/**
 * Signs the user out (clears Supabase session cookies) and returns to "next"
 * or home. POST-only so crawlers cannot log users out via a GET link.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient().catch((err) => {
    // Local-data mode: nothing to sign out of — just go home.
    console.error("[auth] logout skipped (Supabase not configured):", err);
    return null;
  });
  if (supabase) {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("[auth] signOut failed:", error.message);
    }
  }

  let next = "/";
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      // Same-origin only: ignore cross-site or malformed referers.
      const refererUrl = new URL(referer);
      if (refererUrl.origin === request.nextUrl.origin) {
        next = parseNextPath(refererUrl.pathname);
      }
    } catch {
      next = "/";
    }
  }
  return NextResponse.redirect(new URL(next, request.nextUrl.origin), {
    status: 303,
  });
}