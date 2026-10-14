import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/validation/auth";

/**
 * Session probe for the header (UserMenu). Returns minimal, non-sensitive
 * data: authenticated flag, email, display name, admin flag.
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        email: null,
        name: null,
        isAdmin: false,
      });
    }

    const meta = user.user_metadata ?? {};
    const name =
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null;

    return NextResponse.json({
      authenticated: true,
      email: user.email ?? null,
      name,
      isAdmin: isAdminEmail(user.email),
    });
  } catch (err) {
    // Supabase not configured (local mode) — treat as signed out.
    console.error("[api/me] failed:", err);
    return NextResponse.json({
      authenticated: false,
      email: null,
      name: null,
      isAdmin: false,
    });
  }
}