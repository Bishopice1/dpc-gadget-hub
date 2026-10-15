const REASONS = [
  {
    title: "100% genuine products",
    body: "Every item is brand new, sealed and verified before it leaves us.",
  },
  {
    title: "Nationwide delivery",
    body: "Same-day dispatch in Lagos, 2–5 days anywhere else in Nigeria.",
  },
  {
    title: "Pay your way",
    body: "Pay on delivery or by bank transfer — no card details required.",
  },
  {
    title: "Real human support",
    body: "Questions on WhatsApp? A real person replies, seven days a week.",
  },
];

export default function WhyUs() {
  return (
    <section
      aria-labelledby="why-us-heading"
      className="border-y border-line bg-gradient-to-b from-white to-accent-soft/40"
    >
      <div className="container-page py-14">
        <h2
          id="why-us-heading"
          className="mb-8 text-2xl font-bold tracking-tight"
        >
          Why buy from DPC Gadget Hub?
        </h2>
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {REASONS.map((reason) => (
            <li
              key={reason.title}
              className="rounded-2xl border border-line bg-white p-5 shadow-sm"
            >
              <span
                aria-hidden="true"
                className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-accent/15 text-accent"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m4.5 12.75 6 6 9-13.5"
                  />
                </svg>
              </span>
              <h3 className="mb-1.5 font-semibold">{reason.title}</h3>
              <p className="text-sm leading-relaxed text-muted">{reason.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}