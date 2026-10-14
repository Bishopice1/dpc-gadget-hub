export const SITE_NAME = "DPC Gadget Hub";
export const SITE_TAGLINE = "Gadgets you can trust, prices you'll love";

export const INSTAGRAM_HANDLE = "@dpcgadgethub";
export const INSTAGRAM_URL = "https://www.instagram.com/dpcgadgethub";

export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "2348012345678";

export function whatsappLink(message?: string): string {
  const base = `https://wa.me/${WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export const CATEGORIES = [
  {
    slug: "phones",
    label: "Phones",
    description: "Android, iPhone and everything in between.",
  },
  {
    slug: "laptops",
    label: "Laptops",
    description: "MacBooks, HP, Dell and business ultrabooks.",
  },
  {
    slug: "audio",
    label: "Audio",
    description: "Headphones, earbuds and Bluetooth speakers.",
  },
  {
    slug: "accessories",
    label: "Accessories",
    description: "Smartwatches, power banks and everyday add-ons.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];