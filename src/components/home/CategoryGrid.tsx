import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export default function CategoryGrid() {
  return (
    <section aria-labelledby="categories-heading" className="container-page py-14">
      <div className="mb-6 flex items-end justify-between gap-4">
        <h2 id="categories-heading" className="text-2xl font-bold tracking-tight">
          Shop by category
        </h2>
        <Link
          href="/shop"
          className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
        >
          View all →
        </Link>
      </div>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {CATEGORIES.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/shop?category=${category.slug}`}
              className="group flex h-full flex-col gap-2 rounded-2xl border border-line bg-surface p-5 transition-colors hover:border-accent/60"
            >
              <span className="text-lg font-semibold transition-colors group-hover:text-accent">
                {category.label}
              </span>
              <span className="text-sm leading-relaxed text-muted">
                {category.description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}