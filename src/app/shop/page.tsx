import { Suspense } from "react";
import type { Metadata } from "next";
import ProductCard from "@/components/product/ProductCard";
import CategoryFilter from "@/components/shop/CategoryFilter";
import SearchBar from "@/components/shop/SearchBar";
import SortSelect from "@/components/shop/SortSelect";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { CATEGORIES, categoryLabel } from "@/lib/constants";
import { getProducts } from "@/lib/catalog";
import { parseShopQuery } from "@/lib/validation/shop";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Browse phones, laptops, audio gear, smartwatches and accessories at DPC Gadget Hub.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function ProductResults({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const query = parseShopQuery(await searchParams);
  const products = await getProducts({
    q: query.q,
    category: query.category,
    sort: query.sort,
  });

  const heading = query.category
    ? categoryLabel(query.category)
    : query.q
      ? `Results for “${query.q}”`
      : "All products";

  return (
    <>
      <p className="mb-4 text-sm text-muted" aria-live="polite">
        {products.length} product{products.length === 1 ? "" : "s"}
      </p>

      {products.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Try a different search term or clear the category filter."
          actionHref="/shop"
          actionLabel="Clear filters"
        />
      ) : (
        <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
      <span className="sr-only">{heading}</span>
    </>
  );
}

function ResultsSkeleton() {
  return (
    <div className="flex min-h-64 items-center justify-center" role="status">
      <Spinner label="Loading products" />
    </div>
  );
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const query = parseShopQuery(params);
  const sortValue = query.sort ?? "newest";

  return (
    <div className="container-page py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Shop</h1>
        <p className="mt-2 text-sm text-muted">
          Genuine gadgets at honest prices — {CATEGORIES.length} categories,
          nationwide delivery.
        </p>
      </header>

      <div className="mb-6 flex flex-col gap-4">
        <Suspense fallback={<div className="h-10" />}>
          <SearchBar initialQuery={query.q ?? ""} />
        </Suspense>
        <CategoryFilter
          active={query.category}
          query={query.q}
          sort={sortValue}
        />
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-muted">Filters apply instantly</span>
          <Suspense fallback={null}>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      <Suspense key={JSON.stringify(params)} fallback={<ResultsSkeleton />}>
        <ProductResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}