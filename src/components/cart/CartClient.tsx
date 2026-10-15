"use client";

import Image from "next/image";
import Link from "next/link";
import QuantitySelector from "@/components/product/QuantitySelector";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";
import { useCart } from "@/components/cart/CartProvider";
import { formatNaira } from "@/lib/format";
import type { StoredCartItem } from "@/lib/cart-storage";

function CartRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: StoredCartItem;
  onUpdate: (qty: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex gap-4 rounded-2xl border border-line bg-surface p-4">
      <Link
        href={`/products/${item.slug}`}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
        aria-label={`View ${item.name}`}
      >
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/products/${item.slug}`}
            className="truncate text-sm font-semibold hover:text-accent"
          >
            {item.name}
          </Link>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${item.name} from cart`}
            className="shrink-0 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-danger"
          >
            Remove
          </button>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {formatNaira(item.price_ngn)} each
        </p>
        <div className="mt-auto flex items-center justify-between pt-2">
          <QuantitySelector
            value={item.quantity}
            onChange={onUpdate}
            max={Math.max(item.stock, 1)}
          />
          <p className="text-sm font-bold">
            {formatNaira(item.price_ngn * item.quantity)}
          </p>
        </div>
      </div>
    </li>
  );
}

export default function CartClient() {
  const { items, subtotal, hydrated, updateQuantity, removeItem, clear } =
    useCart();

  if (!hydrated) {
    return (
      <div className="flex justify-center py-16" aria-label="Loading cart">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Browse the shop and add gadgets you love — they will appear here."
        actionLabel="Browse shop"
        actionHref="/shop"
      />
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted" aria-live="polite">
            {items.reduce((t, i) => t + i.quantity, 0)} item(s)
          </p>
          <button
            type="button"
            onClick={clear}
            className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:text-danger"
          >
            Clear cart
          </button>
        </div>
        <ul className="space-y-3">
          {items.map((item) => (
            <CartRow
              key={item.product_id}
              item={item}
              onUpdate={(qty) => updateQuantity(item.product_id, qty)}
              onRemove={() => removeItem(item.product_id)}
            />
          ))}
        </ul>
      </div>

      <aside
        aria-label="Cart summary"
        className="h-fit rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-24"
      >
        <h2 className="text-base font-bold">Summary</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd className="font-semibold">{formatNaira(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Delivery</dt>
            <dd className="font-semibold">Calculated at checkout</dd>
          </div>
          <div className="flex justify-between border-t border-line pt-3 text-base">
            <dt className="font-bold">Total</dt>
            <dd className="font-bold">{formatNaira(subtotal)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          Prices are confirmed from the shop catalogue when you place your
          order.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            href="/checkout"
            className="rounded-xl bg-accent px-6 py-3.5 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover hover:text-white"
          >
            Proceed to checkout
          </Link>
          <Link
            href="/shop"
            className="rounded-xl border border-line px-6 py-3 text-center text-sm font-semibold transition-colors hover:bg-surface-2"
          >
            Continue shopping
          </Link>
        </div>
      </aside>
    </div>
  );
}
