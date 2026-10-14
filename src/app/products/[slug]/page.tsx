import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ImageGallery from "@/components/product/ImageGallery";
import ProductPurchase from "@/components/product/ProductPurchase";
import ProductCard from "@/components/product/ProductCard";
import StockBadge from "@/components/product/StockBadge";
import {
  categoryLabel,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
  whatsappLink,
} from "@/lib/constants";
import { getProductBySlug, getRelatedProducts } from "@/lib/catalog";
import { formatNaira } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product, 4);

  return (
    <div className="container-page py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href="/shop" className="hover:text-accent">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/shop?category=${product.category}`}
              className="hover:text-accent"
            >
              {categoryLabel(product.category)}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-ink">
            {product.name}
          </li>
        </ol>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <ImageGallery images={product.image_urls} alt={product.name} />

        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-muted">
              {categoryLabel(product.category)}
            </span>
            <StockBadge stock={product.stock} />
          </div>

          <h1 className="text-3xl font-bold leading-tight tracking-tight">
            {product.name}
          </h1>

          <p className="text-3xl font-extrabold text-accent">
            {formatNaira(product.price_ngn)}
            <span className="ml-2 text-xs font-normal text-muted">
              inclusive of VAT
            </span>
          </p>

          <p className="text-sm leading-relaxed text-muted">
            {product.description}
          </p>

          <ProductPurchase product={product} />

          <div className="rounded-2xl border border-line bg-surface p-5 text-sm">
            <h2 className="mb-2 font-semibold">Delivery &amp; payment</h2>
            <ul className="list-inside list-disc space-y-1.5 text-muted">
              <li>Dispatch within 24 hours of order confirmation.</li>
              <li>Pay on delivery or by bank transfer at checkout.</li>
              <li>
                Questions?{" "}
                <a
                  href={whatsappLink(
                    `Hi DPC Gadget Hub, I'm asking about: ${product.name}`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  Chat on WhatsApp
                </a>{" "}
                or{" "}
                <a
                  href={INSTAGRAM_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent-hover"
                >
                  DM {INSTAGRAM_HANDLE}
                </a>
                .
              </li>
            </ul>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="mt-16">
          <h2
            id="related-heading"
            className="mb-6 text-2xl font-bold tracking-tight"
          >
            You may also like
          </h2>
          <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <li key={item.id}>
                <ProductCard product={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}