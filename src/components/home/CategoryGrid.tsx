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
              className="group flex h-full flex-col gap-2 rounded-2xl border border-line bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent hover:shadow-lg hover:shadow-accent/10"
            >
              <span aria-hidden="true" className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-soft text-lg">
                {category.slug === "phones" ? "📱" : category.slug === "laptops" ? "💻" : category.slug === "audio" ? "🎧" : "⌚"}
              </span>
              <span className="text-lg font-bold text-navy transition-colors group-hover:text-accent">
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