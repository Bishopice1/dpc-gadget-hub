import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  whatsappLink,
} from "@/lib/constants";

export default function ContactBand() {
  return (
    <section aria-labelledby="contact-heading" className="container-page py-14">
      <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-accent/30 bg-surface p-8 sm:p-10">
        <div>
          <h2 id="contact-heading" className="text-2xl font-bold tracking-tight">
            Talk to us before you buy
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">
            Need recommendations, bulk pricing or order tracking? Message us on
            WhatsApp or DM {INSTAGRAM_HANDLE} — we respond daily.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href={whatsappLink("Hi DPC Gadget Hub, I'd like to place an order.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl bg-accent px-5 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover hover:text-white"
          >
            WhatsApp us
          </a>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-surface-2 px-5 py-3 text-center text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
          >
            Instagram {INSTAGRAM_HANDLE}
          </a>
        </div>
      </div>
    </section>
  );
}