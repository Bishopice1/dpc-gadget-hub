import { z } from "zod";

/**
 * Validates shop page query params (search, category filter, sort).
 * Invalid values are replaced with safe defaults instead of erroring.
 */

const SORT_VALUES = ["newest", "price-asc", "price-desc"] as const;
const CATEGORY_VALUES = [
  "phones",
  "laptops",
  "audio",
  "accessories",
] as const;

export const shopQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "Search is too long")
    .transform((v) => (v ? v : undefined))
    .optional(),
  category: z.enum(CATEGORY_VALUES).optional(),
  sort: z.enum(SORT_VALUES).optional(),
});

export type ShopQuery = z.infer<typeof shopQuerySchema>;

export function parseShopQuery(
  params: Record<string, string | string[] | undefined>,
): ShopQuery {
  const flat: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(params)) {
    flat[key] = Array.isArray(value) ? value[0] : value;
  }
  const parsed = shopQuerySchema.safeParse(flat);
  if (parsed.success) return parsed.data;
  // Drop invalid fields rather than failing the page.
  return {};
}