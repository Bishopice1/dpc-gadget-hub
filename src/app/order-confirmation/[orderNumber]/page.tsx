import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/orders/StatusBadge";
import EmptyState from "@/components/ui/EmptyState";
import { formatDate, formatNaira } from "@/lib/format";
import { getMyOrderByNumber } from "@/lib/orders/mine";
import { getPaymentProvider } from "@/lib/payments/types";

export const metadata: Metadata = {
  title: "Order confirmation",
  description: "Your order has been placed.",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  let order;
  try {
    order = await getMyOrderByNumber(orderNumber);
  } catch {
    return (
      <div className="container-page py-10">
        <EmptyState
          title="Could not load your order"
          description="Something went wrong. Check your connection and open My Orders to find it."
          actionLabel="My orders"
          actionHref="/orders"
        />
      </div>
    );
  }
  if (!order) notFound();

  const payment = getPaymentProvider(order.payment_method);

  return (
    <div className="container-page max-w-2xl py-10">
      <div className="rounded-2xl border border-accent/30 bg-surface p-8 text-center">
        <p aria-hidden="true" className="text-4xl">✓</p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight">
          Order placed — thank you!
        </h1>
        <p className="mt-2 text-sm text-muted">
          Your order number is
        </p>
        <p className="mt-1 font-mono text-xl font-bold text-accent">
          {order.order_number}
        </p>
        <div className="mt-3 flex justify-center">
          <StatusBadge status={order.status} />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We will call <strong className="text-ink">{order.phone}</strong> to
          confirm delivery to {order.city}, {order.state}.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6">
        <h2 className="text-base font-bold">Items</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4">
              <span className="text-muted">
                {item.name} <span className="text-xs">× {item.quantity}</span>
              </span>
              <span className="shrink-0 font-medium">
                {formatNaira(item.unit_price_ngn * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-line pt-4 text-base font-bold">
          <span>Total</span>
          <span>{formatNaira(order.total_ngn)}</span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface p-6 text-sm">
        <h2 className="text-base font-bold">Delivery & payment</h2>
        <dl className="mt-3 space-y-1.5">
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Name</dt>
            <dd>{order.full_name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Address</dt>
            <dd>
              {order.address}, {order.city}, {order.state}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Payment</dt>
            <dd>{payment.label}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-24 shrink-0 text-muted">Placed</dt>
            <dd>{formatDate(order.created_at)}</dd>
          </div>
          {order.note && (
            <div className="flex gap-2">
              <dt className="w-24 shrink-0 text-muted">Note</dt>
              <dd>{order.note}</dd>
            </div>
          )}
        </dl>
        <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs leading-relaxed text-muted">
          {payment.instructions}
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/orders"
          className="rounded-xl bg-accent px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-accent-hover hover:text-white"
        >
          Track in My Orders
        </Link>
        <Link
          href="/shop"
          className="rounded-xl border border-line px-6 py-3 text-center text-sm font-semibold transition-colors hover:bg-surface-2"
        >
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
