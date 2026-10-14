import type { CategorySlug } from "@/lib/constants";

export type { CategorySlug };

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_ngn: number;
  category: CategorySlug;
  image_urls: string[];
  stock: number;
  is_featured: boolean;
  created_at: string;
}

export interface ProductFilters {
  q?: string;
  category?: string;
  sort?: string;
  featuredOnly?: boolean;
  limit?: number;
}