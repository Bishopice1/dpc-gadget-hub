import Link from "next/link";
import StatusBadge from "@/components/orders/StatusBadge";
import { formatDate, formatNaira } from "@/lib/format";
import type { Order } from "@/lib/orders/types";
import { getPaymentProvider } from "@/lib/payments/types";

export default function OrderCard({ order }: { order: Order }) {
  return (
    <article className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/order-confirmation/${order.order_number}`}
            className="font-mono text-sm font-bold text-accent hover:text-accent-hover"
          >
            {order.order_number}
          </Link>
          <p className="mt-1 text-xs text-muted">
            Placed {formatDate(order.created_at)} ·{" "}
            {getPaymentProvider(order.payment_method).label}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-4">
            <span className="text-muted">
              {item.name}{" "}
              <span className="text-xs">× {item.quantity}</span>
            </span>
            <span className="shrink-0 font-medium">
              {formatNaira(item.unit_price_ngn * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
        <span className="text-muted">
          {order.items.reduce((t, i) => t + i.quantity, 0)} item(s) ·{" "}
          {order.city}, {order.state}
        </span>
        <span className="text-base font-bold">
          {formatNaira(order.total_ngn)}
        </span>
      </div>
    </article>
  );
}
