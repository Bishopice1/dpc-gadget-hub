import Link from "next/link";
import Hero from "@/components/home/Hero";
import CategoryGrid from "@/components/home/CategoryGrid";
import WhyUs from "@/components/home/WhyUs";
import ContactBand from "@/components/home/ContactBand";
import ProductCard from "@/components/product/ProductCard";
import { getFeaturedProducts } from "@/lib/catalog";

export default async function HomePage() {
  const featured = await getFeaturedProducts(4);

  return (
    <>
      <Hero />

      <section aria-labelledby="featured-heading" className="container-page py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
              Hand-picked for you
            </p>
            <h2
              id="featured-heading"
              className="mt-1 text-2xl font-extrabold tracking-tight text-navy"
            >
              Featured picks
            </h2>
          </div>
          <Link
            href="/shop"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View all →
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line bg-surface px-6 py-10 text-center text-sm text-muted">
            Products are being restocked — check back soon.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((product, index) => (
              <li key={product.id}>
                <ProductCard product={product} priority={index < 2} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <CategoryGrid />
      <WhyUs />
      <ContactBand />
    </>
  );
}