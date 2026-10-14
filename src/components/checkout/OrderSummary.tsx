"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import { formatNaira } from "@/lib/format";

export default function OrderSummary() {
  const { items, subtotal } = useCart();

  return (
    <aside
      aria-label="Order summary"
      className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24"
    >
      <h2 className="text-base font-bold">
        Order summary{" "}
        <span className="font-normal text-muted">
          ({items.reduce((t, i) => t + i.quantity, 0)} items)
        </span>
      </h2>

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-muted">
          Your cart is empty.{" "}
          <Link href="/shop" className="text-accent hover:text-accent-hover">
            Browse the shop
          </Link>
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((item) => (
            <li key={item.product_id} className="flex items-center gap-3">
              <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                <Image
                  src={item.image_url}
                  alt=""
                  fill
                  sizes="48px"
                  className="object-cover"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {item.name}
                </span>
                <span className="text-xs text-muted">
                  × {item.quantity}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold">
                {formatNaira(item.price_ngn * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal</dt>
          <dd className="font-semibold">{formatNaira(subtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Delivery fee</dt>
          <dd className="font-semibold">Confirmed on call</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-3 text-base">
          <dt className="font-bold">Total</dt>
          <dd className="font-bold" aria-live="polite">
            {formatNaira(subtotal)}
          </dd>
        </div>
      </dl>
    </aside>
  );
}
