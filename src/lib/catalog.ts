import source from "../../data/products-source.json";
import type { Product, ProductFilters, CategorySlug } from "@/lib/types";
import { createPublicClient } from "@/lib/supabase/public";

/**
 * Catalogue reads products from Supabase when NEXT_PUBLIC_SUPABASE_URL +
 * NEXT_PUBLIC_SUPABASE_ANON_KEY are configured, and falls back to the local
 * data/products-source.json seed otherwise (dev before setup, builds without
 * secrets). RLS exposes products publicly for SELECT.
 */

const localProducts: Product[] = source.products.map(
  ({
    id,
    name,
    slug,
    description,
    price_ngn,
    category,
    stock,
    is_featured,
    created_at,
    images,
  }) => ({
    id,
    name,
    slug,
    description,
    price_ngn,
    category: category as CategorySlug,
    stock,
    is_featured,
    created_at,
    image_urls: images,
  }),
);

const SORT_COLUMNS: Record<string, { column: string; ascending: boolean }> = {
  newest: { column: "created_at", ascending: false },
  "price-asc": { column: "price_ngn", ascending: true },
  "price-desc": { column: "price_ngn", ascending: false },
};

type ProductRow = Record<string, unknown>;

function rowToProduct(row: ProductRow): Product {
  return {
    id: String(row.id),
    name: String(row.name),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    price_ngn: Number(row.price_ngn),
    category: String(row.category) as CategorySlug,
    image_urls: Array.isArray(row.image_urls)
      ? (row.image_urls as string[])
      : [],
    stock: Number(row.stock ?? 0),
    is_featured: Boolean(row.is_featured),
    created_at: String(row.created_at),
  };
}

export function allProducts(): Product[] {
  return [...localProducts];
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  const { q, category, sort = "newest", featuredOnly, limit } = filters;
  const supabase = createPublicClient();

  if (supabase) {
    // NOTE: Supabase's FilterBuilder / TransformBuilder generics are not
    // mutually assignable, so each filter combination is built in its own
    // branch (no cross-branch reassignment) and awaited immediately.
    const order = SORT_COLUMNS[sort] ?? SORT_COLUMNS.newest;
    const needle = q && q.trim() ? q.trim().replace(/[%_,()]/g, " ") : null;
    const search = needle
      ? `name.ilike.%${needle}%,description.ilike.%${needle}%`
      : null;
    const from = supabase.from("products");
    const orderOpts = {
      ascending: order.ascending,
      nullsFirst: false as const,
    };
    const take = limit && limit > 0 ? limit : null;

    type QueryResult = {
      data: ProductRow[] | null;
      error: { message: string } | null;
    };
    let result: QueryResult;
    if (search && featuredOnly && category) {
      const q1 = from
        .select("*")
        .eq("is_featured", true)
        .eq("category", category)
        .or(search)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (search && featuredOnly) {
      const q1 = from
        .select("*")
        .eq("is_featured", true)
        .or(search)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (search && category) {
      const q1 = from
        .select("*")
        .eq("category", category)
        .or(search)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (search) {
      const q1 = from.select("*").or(search).order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (featuredOnly && category) {
      const q1 = from
        .select("*")
        .eq("is_featured", true)
        .eq("category", category)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (featuredOnly) {
      const q1 = from
        .select("*")
        .eq("is_featured", true)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else if (category) {
      const q1 = from
        .select("*")
        .eq("category", category)
        .order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    } else {
      const q1 = from.select("*").order(order.column, orderOpts);
      result = (take ? await q1.limit(take) : await q1) as QueryResult;
    }

    const { data, error } = result;
    if (error) {
      console.error("[catalog] Supabase query failed, using local data:", error.message);
    } else {
      return (data ?? []).map(rowToProduct);
    }
  }

  // ---- Local fallback (same behaviour as Phase 1) ----
  let local = localProducts;
  if (featuredOnly) local = local.filter((p) => p.is_featured);
  if (category) local = local.filter((p) => p.category === category);
  if (q && q.trim()) {
    const needle = q.trim().toLowerCase();
    local = local.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }

  local = [...local];
  switch (sort) {
    case "price-asc":
      local.sort((a, b) => a.price_ngn - b.price_ngn);
      break;
    case "price-desc":
      local.sort((a, b) => b.price_ngn - a.price_ngn);
      break;
    default:
      local.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }

  if (limit && limit > 0) local = local.slice(0, limit);
  return local;
}

export async function getFeaturedProducts(limit = 4): Promise<Product[]> {
  return getProducts({ featuredOnly: true, sort: "newest", limit });
}

export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const supabase = createPublicClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    if (error) {
      console.error("[catalog] getProductBySlug failed:", error.message);
    } else if (data) {
      return rowToProduct(data as ProductRow);
    } else {
      return undefined; // slug genuinely not found in DB
    }
  }
  return localProducts.find((p) => p.slug === slug);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  return getProducts({
    category: product.category,
    sort: "newest",
    limit: limit + 1,
  }).then((items) =>
    items.filter((p) => p.slug !== product.slug).slice(0, limit),
  );
}