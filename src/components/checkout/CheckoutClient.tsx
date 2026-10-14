"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ChangeEvent } from "react";
import OrderSummary from "@/components/checkout/OrderSummary";
import PaymentMethodPicker from "@/components/checkout/PaymentMethodPicker";
import Spinner from "@/components/ui/Spinner";
import { useCart } from "@/components/cart/CartProvider";
import { nigerianPhoneSchema, type PaymentMethod } from "@/lib/validation/checkout";
import { cn } from "@/lib/utils";

interface FormState {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  note: string;
}

const EMPTY_FORM: FormState = {
  full_name: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  note: "",
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

function fieldError(name: keyof FormState, value: string): string | null {
  const v = value.trim();
  switch (name) {
    case "full_name":
      if (v.length < 2) return "Enter your full name.";
      if (v.length > 120) return "Name is too long.";
      return null;
    case "phone":
      if (!v) return "Phone number is required.";
      const digits = v.replace(/[\s\-()]/g, "");
      return nigerianPhoneSchema.safeParse(digits).success
        ? null
        : "Enter a valid Nigerian number, e.g. 08031234567.";
    case "address":
      if (v.length < 8) return "Enter your full delivery address.";
      if (v.length > 500) return "Address is too long.";
      return null;
    case "city":
      if (v.length < 2) return "City is required.";
      if (v.length > 100) return "City is too long.";
      return null;
    case "state":
      if (v.length < 2) return "State is required.";
      if (v.length > 100) return "State is too long.";
      return null;
    case "note":
      if (v.length > 500) return "Note is too long (500 chars max).";
      return null;
    default:
      return null;
  }
}

const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-xl border bg-base px-4 py-3 text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2",
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/30"
      : "border-line focus:border-accent focus:ring-accent/30",
  );

export default function CheckoutClient() {
  const router = useRouter();
  const { items, hydrated, clear } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormState, boolean>>
  >({});
  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("pay_on_delivery");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Prefill name from the signed-in profile (best-effort).
  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((me: { name?: string | null } | null) => {
        if (me?.name) {
          setForm((f) =>
            f.full_name ? f : { ...f, full_name: me.name ?? "" },
          );
        }
      })
      .catch(() => undefined);
  }, []);

  function handleChange(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = event.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleBlur(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name } = event.target;
    setTouched((t) => ({ ...t, [name]: true }));
  }

  const errors: FieldErrors = {};
  (Object.keys(EMPTY_FORM) as (keyof FormState)[]).forEach((key) => {
    if (key === "note" && !form.note) return;
    if (touched[key]) {
      const err = fieldError(key, form[key]);
      if (err) errors[key] = err;
    }
  });

  function validateAll(): boolean {
    setTouched({
      full_name: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      note: true,
    });
    return (Object.keys(EMPTY_FORM) as (keyof FormState)[]).every((key) => {
      if (key === "note" && !form.note.trim()) return true;
      return fieldError(key, form[key]) === null;
    });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError(null);
    if (!validateAll()) {
      document.querySelector<HTMLElement>("[data-invalid='true']")?.focus();
      return;
    }
    if (items.length === 0) {
      setSubmitError("Your cart is empty. Add some gadgets first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name.trim(),
          phone: form.phone.replace(/[\s\-()]/g, ""),
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          note: form.note.trim() || undefined,
          payment_method: paymentMethod,
          items: items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
          })),
        }),
      });
      const data = (await res.json()) as {
        order_number?: string;
        error?: string;
      };
      if (!res.ok || !data.order_number) {
        setSubmitError(
          data.error ?? "Could not place your order. Please try again.",
        );
        if (res.status === 401) router.push("/login?next=%2Fcheckout");
        return;
      }
      clear();
      router.push(`/order-confirmation/${data.order_number}`);
    } catch {
      setSubmitError("Network error. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16" aria-label="Loading checkout">
        <Spinner />
      </div>
    );
  }

  const fields: {
    name: keyof FormState;
    label: string;
    type?: string;
    placeholder: string;
    autoComplete: string;
    textarea?: boolean;
    optional?: boolean;
    hint?: string;
  }[] = [
    { name: "full_name", label: "Full name", placeholder: "Adaeze Okafor", autoComplete: "name" },
    { name: "phone", label: "Phone number", type: "tel", placeholder: "08031234567", autoComplete: "tel", hint: "We call this number to confirm delivery." },
    { name: "address", label: "Delivery address", placeholder: "14 Allen Avenue, Ikeja", autoComplete: "street-address", textarea: true },
    { name: "city", label: "City", placeholder: "Lagos", autoComplete: "address-level2" },
    { name: "state", label: "State", placeholder: "Lagos State", autoComplete: "address-level1" },
  ];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        <section aria-labelledby="delivery-heading" className="rounded-2xl border border-line bg-surface p-5">
          <h2 id="delivery-heading" className="text-base font-bold">Delivery details</h2>
          <div className="mt-4 space-y-4">
            {fields.map((field) => {
              const invalid = Boolean(errors[field.name]);
              const id = `checkout-${field.name}`;
              return (
                <div key={field.name}>
                  <label htmlFor={id} className="mb-1.5 block text-sm font-medium">{field.label}</label>
                  {field.textarea ? (
                    <textarea id={id} name={field.name} rows={3} value={form[field.name]} onChange={handleChange} onBlur={handleBlur} placeholder={field.placeholder} autoComplete={field.autoComplete} aria-invalid={invalid} data-invalid={invalid || undefined} aria-describedby={errors[field.name] ? `${id}-error` : undefined} className={inputClass(invalid)} />
                  ) : (
                    <input id={id} name={field.name} type={field.type ?? "text"} value={form[field.name]} onChange={handleChange} onBlur={handleBlur} placeholder={field.placeholder} autoComplete={field.autoComplete} aria-invalid={invalid} data-invalid={invalid || undefined} aria-describedby={errors[field.name] ? `${id}-error` : field.hint ? `${id}-hint` : undefined} className={inputClass(invalid)} />
                  )}
                  {field.hint && !errors[field.name] && <p id={`${id}-hint`} className="mt-1 text-xs text-muted">{field.hint}</p>}
                  {errors[field.name] && <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-danger">{errors[field.name]}</p>}
                </div>
              );
            })}
            <div>
              <label htmlFor="checkout-note" className="mb-1.5 block text-sm font-medium">Delivery note <span className="font-normal text-muted">(optional)</span></label>
              <textarea id="checkout-note" name="note" rows={2} value={form.note} onChange={handleChange} onBlur={handleBlur} placeholder="Landmark, gate code, best time to call…" autoComplete="off" aria-invalid={Boolean(errors.note)} className={inputClass(Boolean(errors.note))} />
              {errors.note && <p role="alert" className="mt-1 text-xs text-danger">{errors.note}</p>}
            </div>
          </div>
        </section>

        <section aria-labelledby="payment-heading" className="rounded-2xl border border-line bg-surface p-5">
          <h2 id="payment-heading" className="text-base font-bold">Payment method</h2>
          <p className="mt-1 text-xs text-muted">Online payment (Paystack) is coming soon.</p>
          <div className="mt-4">
            <PaymentMethodPicker value={paymentMethod} onChange={setPaymentMethod} />
          </div>
        </section>

        {submitError && <p role="alert" className="rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{submitError}</p>}

        <button type="submit" disabled={submitting || items.length === 0} className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-semibold text-black transition-colors hover:bg-accent-hover hover:text-white disabled:cursor-not-allowed disabled:opacity-50">
          {submitting && <Spinner label="Placing order" />}
          {submitting ? "Placing your order…" : "Place order"}
        </button>
      </form>

      <OrderSummary />
    </div>
  );
}

