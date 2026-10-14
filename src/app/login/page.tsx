import type { Metadata } from "next";
import Link from "next/link";
import { parseNextPath } from "@/lib/validation/auth";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to DPC Gadget Hub with Google to place orders.",
};

type SearchParams = Promise<{ next?: string; error?: string }>;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const next = parseNextPath(params.next);
  const errorMessage = params.error;
  const googleHref = `/auth/login/google?next=${encodeURIComponent(next)}`;

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-black text-black"
          >
            D
          </span>
          <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Continue with Google to place orders, save your cart and track
            deliveries.
          </p>
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger"
          >
            {errorMessage}
          </p>
        )}

        <a
          href={googleHref}
          className="flex w-full items-center justify-center gap-3 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover hover:text-white"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="currentColor"
          >
            <path d="M21.35 11.1H12v2.9h5.35c-.5 2.5-2.6 3.9-5.35 3.9a6 6 0 1 1 0-12c1.55 0 2.95.55 4.05 1.55l2.15-2.15A9 9 0 1 0 12 21c4.95 0 8.95-3.65 8.95-9 0-.3-.02-.6-.05-.9h-.55Z" />
          </svg>
          Continue with Google
        </a>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          By signing in you agree to be contacted about your order. Need help?{" "}
          <Link href="/" className="text-accent hover:text-accent-hover">
            Back to shop
          </Link>
        </p>
      </div>
    </div>
  );
}