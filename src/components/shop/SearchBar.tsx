"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQuery);
  const [lastInitial, setLastInitial] = useState(initialQuery);

  // Keep the field in sync when the URL changes (back/forward navigation).
  if (lastInitial !== initialQuery) {
    setLastInitial(initialQuery);
    setValue(initialQuery);
  }

  function apply(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.trim()) {
      params.set("q", next.trim());
    } else {
      params.delete("q");
    }
    params.delete("page");
    router.replace(`/shop${params.size > 0 ? `?${params}` : ""}`, {
      scroll: false,
    });
  }

  return (
    <form
      role="search"
      className="relative w-full sm:max-w-xs"
      onSubmit={(event) => {
        event.preventDefault();
        apply(value);
      }}
    >
      <label htmlFor="shop-search" className="sr-only">
        Search products
      </label>
      <input
        id="shop-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => apply(value)}
        placeholder="Search products…"
        className="w-full rounded-xl border border-line bg-surface px-4 py-2.5 pr-10 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
      />
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:text-accent"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-5 w-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-4.35-4.35m1.35-5.15a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z"
          />
        </svg>
      </button>
    </form>
  );
}