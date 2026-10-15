import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  whatsappLink,
} from "@/lib/constants";

export default function ContactBand() {
  return (
    <section aria-labelledby="contact-heading" className="container-page py-14">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-accent to-[#4d86ff] p-8 text-white shadow-lg shadow-accent/20 sm:p-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "36px 36px",
          }}
        />
        <div className="relative flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
              Fast reply · 7 days a week
            </p>
            <h2 id="contact-heading" className="mt-1 text-2xl font-extrabold tracking-tight">
              Talk to us before you buy
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-blue-50/90">
              Need recommendations, bulk pricing or order tracking? Message us on
              WhatsApp or DM {INSTAGRAM_HANDLE} — we respond daily.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            <a
              href={whatsappLink("Hi DPC Gadget Hub, I'd like to place an order.")}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-navy shadow transition hover:bg-blue-50"
            >
              WhatsApp us
            </a>
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl border border-white/40 bg-white/10 px-5 py-3 text-center text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Instagram {INSTAGRAM_HANDLE}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}