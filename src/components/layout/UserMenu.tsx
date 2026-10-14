"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface MeResponse {
  authenticated: boolean;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
}

/**
 * Header auth slot: fetches /api/me (server-checked session + ADMIN_EMAILS)
 * and renders sign-in link or a user menu with orders/admin/logout.
 */
export default function UserMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: MeResponse | null) => {
        if (!cancelled && data) setMe(data);
      })
      .catch(() => {
        /* network error — treat as signed out */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Close the menu on route change (render-time adjustment).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    if (menuOpen) setMenuOpen(false);
  }

  // Close menu on outside click.
  useEffect(() => {
    if (!menuOpen) return;
    function onClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  async function handleLogout() {
    setMenuOpen(false);
    await fetch("/auth/logout", { method: "POST" }).catch(() => undefined);
    setMe({ authenticated: false, email: null, name: null, isAdmin: false });
    router.refresh();
  }

  if (loading) {
    return (
      <div
        className="h-9 w-24 animate-pulse rounded-lg bg-surface-2"
        aria-hidden="true"
      />
    );
  }

  if (!me?.authenticated) {
    return (
      <Link
        href={`/login?next=${encodeURIComponent(pathname)}`}
        className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-hover hover:text-white"
      >
        Sign in
      </Link>
    );
  }

  const initials = (me.name ?? me.email ?? "U")
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-expanded={menuOpen}
        aria-haspopup="menu"
        aria-label="Account menu"
        onClick={() => setMenuOpen((open) => !open)}
        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-ink transition-colors hover:bg-line"
      >
        {initials}
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-line bg-surface p-2 shadow-xl"
        >
          <p className="truncate px-3 py-2 text-xs text-muted" title={me.email ?? ""}>
            {me.email}
          </p>
          <div className="my-1 border-t border-line" />
          <Link
            href="/orders"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2"
          >
            My orders
          </Link>
          <Link
            href="/cart"
            role="menuitem"
            className="block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-surface-2"
          >
            Cart
          </Link>
          {me.isAdmin && (
            <Link
              href="/admin"
              role="menuitem"
              className="block rounded-lg px-3 py-2 text-sm text-accent transition-colors hover:bg-surface-2"
            >
              Admin dashboard
            </Link>
          )}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-danger transition-colors hover:bg-surface-2"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}