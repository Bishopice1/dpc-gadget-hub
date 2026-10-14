import Link from "next/link";
import {
  CATEGORIES,
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  SITE_NAME,
  whatsappLink,
} from "@/lib/constants";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-page grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <p className="flex items-center gap-2 font-semibold">
            <span
              aria-hidden="true"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-black text-black"
            >
              D
            </span>
            DPC Gadget Hub
          </p>
          <p className="text-sm leading-relaxed text-muted">
            Brand-new phones, laptops, audio gear and accessories — genuine
            products, nationwide delivery across Nigeria.
          </p>
        </div>

        <nav aria-label="Shop categories">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Categories
          </h2>
          <ul className="space-y-2 text-sm">
            {CATEGORIES.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/shop?category=${category.slug}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {category.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Customer links">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Customer care
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/shop"
                className="text-muted transition-colors hover:text-accent"
              >
                Browse all products
              </Link>
            </li>
            <li>
              <Link
                href="/orders"
                className="text-muted transition-colors hover:text-accent"
              >
                Track my order
              </Link>
            </li>
            <li>
              <a
                href={whatsappLink(
                  "Hi DPC Gadget Hub, I have a question about an order.",
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-accent"
              >
                Chat on WhatsApp
              </a>
            </li>
            <li>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-accent"
              >
                Instagram {INSTAGRAM_HANDLE}
              </a>
            </li>
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">
            Payment
          </h2>
          <ul className="space-y-2 text-sm text-muted">
            <li>Pay on delivery</li>
            <li>Bank transfer</li>
            <li>Prices in Nigerian Naira (₦)</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <p className="container-page py-4 text-xs text-muted">
          © {year} {SITE_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}