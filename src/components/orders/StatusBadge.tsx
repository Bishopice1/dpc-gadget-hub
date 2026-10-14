import { ORDER_STATUS_LABELS, type OrderStatus } from "@/lib/orders/types";
import { cn } from "@/lib/utils";

const STYLES: Record<OrderStatus, string> = {
  pending: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  confirmed: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  shipped: "border-violet-400/40 bg-violet-400/10 text-violet-300",
  delivered: "border-accent/40 bg-accent/10 text-accent",
  cancelled: "border-danger/40 bg-danger/10 text-danger",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        STYLES[status],
      )}
    >
      {ORDER_STATUS_LABELS[status]}
    </span>
  );
}
