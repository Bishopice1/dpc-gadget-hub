import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminEmail, parseNextPath } from "@/lib/validation/auth";

/**
 * Session refresh + route protection.
 * (Kept as middleware.ts: Next.js 16 prefers proxy.ts, but the middleware
 * convention still works — see Phase 6 cleanup.)
 *  - /checkout, /orders, /order-confirmation: require a signed-in user.
 *  - /admin: requires an email listed in ADMIN_EMAILS.
 * Unauthenticated users are redirected to /login?next=<destination>.
 */
const PROTECTED_PREFIXES = [
  "/checkout",
  "/orders",
  "/order-confirmation",
  "/admin",
];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Without Supabase config the app still runs (local-data mode); skip auth.
  if (!url || !anonKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // Refresh the session (populates request.cookies for the page render).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const needsAuth = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (needsAuth && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set(
      "next",
      parseNextPath(pathname + request.nextUrl.search),
    );
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/admin") && user && !isAdminEmail(user.email)) {
    const home = request.nextUrl.clone();
    home.pathname = "/";
    home.search = "";
    return NextResponse.redirect(home);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Exclude static assets, images and API routes from session handling.
     */
    "/((?!_next/static|_next/image|favicon.ico|products/|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};