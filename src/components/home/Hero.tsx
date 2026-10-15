import Link from "next/link";
import { SITE_TAGLINE, whatsappLink } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line bg-surface">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_60%_at_80%_10%,color-mix(in_oklab,var(--color-accent)_18%,transparent),transparent)]"
      />
      <div className="container-page relative flex flex-col gap-6 py-16 sm:py-24">
        <p className="text-sm font-semibold uppercase tracking-widest text-accent">
          DPC Gadget Hub
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          Gadgets you can trust, prices you&apos;ll love.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-muted">
          Brand-new phones, laptops, audio and smartwatches — {SITE_TAGLINE.toLowerCase()}.
          Nationwide delivery across Nigeria with pay on delivery or bank
          transfer.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover hover:text-white"
          >
            Shop all products
          </Link>
          <a
            href={whatsappLink(
              "Hi DPC Gadget Hub, I'd like to ask about a product.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-surface px-6 py-3.5 text-center text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}