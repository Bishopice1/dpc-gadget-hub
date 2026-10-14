"use client";

import { PAYMENT_METHOD_OPTIONS, getPaymentProvider } from "@/lib/payments/types";
import type { PaymentMethod } from "@/lib/validation/checkout";
import { cn } from "@/lib/utils";

export default function PaymentMethodPicker({
  value,
  onChange,
}: {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Payment method" className="space-y-2">
      {PAYMENT_METHOD_OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              selected
                ? "border-accent bg-accent/5"
                : "border-line bg-surface hover:border-muted",
            )}
          >
            <input
              type="radio"
              name="payment_method"
              value={option.value}
              checked={selected}
              onChange={() => onChange(option.value)}
              className="mt-1 h-4 w-4 accent-emerald-500"
            />
            <span>
              <span className="block text-sm font-semibold">
                {option.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                {option.hint}
              </span>
              {selected && (
                <span className="mt-2 block text-xs leading-relaxed text-muted">
                  {getPaymentProvider(option.value).instructions}
                </span>
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}
