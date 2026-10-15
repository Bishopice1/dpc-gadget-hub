import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

/**
 * Category pill filter — plain links so it works without JavaScript and
 * keeps URLs shareable (/shop?category=phones).
 */
export default function CategoryFilter({
  active,
  query,
  sort,
}: {
  active?: string;
  query?: string;
  sort?: string;
}) {
  function hrefFor(slug?: string): string {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (sort && sort !== "newest") params.set("sort", sort);
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return `/shop${qs ? `?${qs}` : ""}`;
  }

  return (
    <nav aria-label="Filter by category">
      <ul className="flex flex-wrap gap-2">
        <li>
          <Link
            href={hrefFor(undefined)}
            aria-current={!active ? "true" : undefined}
            className={cn(
              "rounded-full border px-4 py-1.5 text-sm transition-colors",
              !active
                ? "border-accent bg-accent text-white font-semibold"
                : "border-line bg-surface text-muted hover:border-accent/50 hover:text-ink",
            )}
          >
            All
          </Link>
        </li>
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link
              href={hrefFor(category.slug)}
              aria-current={active === category.slug ? "true" : undefined}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm transition-colors",
                active === category.slug
                  ? "border-accent bg-accent text-white font-semibold"
                  : "border-line bg-surface text-muted hover:border-accent/50 hover:text-ink",
              )}
            >
              {category.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}