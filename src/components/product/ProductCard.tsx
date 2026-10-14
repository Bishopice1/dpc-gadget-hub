import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/format";
import { categoryLabel } from "@/lib/constants";
import type { Product } from "@/lib/types";
import StockBadge from "@/components/product/StockBadge";

export default function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  const imageUrl = product.image_urls[0] ?? "/products/placeholder.svg";

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-colors hover:border-accent/50">
      <Link
        href={`/products/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-surface-2"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          priority={priority}
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs uppercase tracking-wider text-muted">
          {categoryLabel(product.category)}
        </p>
        <h3 className="text-sm font-semibold leading-snug">
          <Link
            href={`/products/${product.slug}`}
            className="transition-colors hover:text-accent"
          >
            {product.name}
          </Link>
        </h3>
        <p className="text-base font-bold text-accent">
          {formatNaira(product.price_ngn)}
        </p>
        <div className="mt-auto pt-1">
          <StockBadge stock={product.stock} />
        </div>
      </div>
    </article>
  );
}