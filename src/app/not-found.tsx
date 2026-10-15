import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="container-page flex min-h-64 flex-col items-center justify-center gap-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Product not found</h1>
      <p className="max-w-md text-sm text-muted">
        This product may have been removed or the link is incorrect.
      </p>
      <div className="flex gap-3">
        <Link
          href="/shop"
          className="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          Back to shop
        </Link>
        <Link
          href="/"
          className="rounded-xl border border-line px-5 py-2.5 text-sm font-semibold transition-colors hover:border-accent hover:text-accent"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}