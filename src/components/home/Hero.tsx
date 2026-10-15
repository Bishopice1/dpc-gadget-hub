import Link from "next/link";
import { SITE_TAGLINE, whatsappLink } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-navy via-accent to-[#4d86ff] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(40rem 20rem at 85% -10%, rgba(255,255,255,0.25), transparent), radial-gradient(30rem 18rem at 10% 110%, rgba(255,255,255,0.15), transparent)",
        }}
      />
      {/* subtle grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(60% 80% at 50% 20%, black, transparent)",
        }}
      />
      <div className="container-page relative flex flex-col gap-6 py-16 sm:py-24">
        <p className="inline-flex w-fit items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white ring-1 ring-white/30 backdrop-blur">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-white" />
          DPC Gadget Hub • Lagos, Nigeria
        </p>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
          Gadgets you can trust, prices you&apos;ll love.
        </h1>
        <p className="max-w-xl text-lg leading-relaxed text-blue-50/90">
          Brand-new phones, laptops, audio and smartwatches — {SITE_TAGLINE.toLowerCase()}.
          Nationwide delivery across Nigeria with pay on delivery or bank
          transfer.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/shop"
            className="rounded-xl bg-white px-6 py-3.5 text-center text-sm font-bold text-accent shadow-lg shadow-navy/20 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Shop all products →
          </Link>
          <a
            href={whatsappLink(
              "Hi DPC Gadget Hub, I'd like to ask about a product.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-center text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            Chat on WhatsApp
          </a>
        </div>
        <dl className="mt-4 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <dt className="sr-only">Quality</dt>
            <dd className="flex items-center gap-2 text-blue-50"><span aria-hidden="true">✓</span> 100% genuine, sealed</dd>
          </div>
          <div className="flex items-center gap-2">
            <dd className="flex items-center gap-2 text-blue-50"><span aria-hidden="true">✓</span> Pay on delivery</dd>
          </div>
          <div className="flex items-center gap-2">
            <dd className="flex items-center gap-2 text-blue-50"><span aria-hidden="true">✓</span> Nationwide delivery</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}