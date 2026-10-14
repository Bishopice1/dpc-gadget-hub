import type { Metadata } from "next";
import OrderCard from "@/components/orders/OrderCard";
import EmptyState from "@/components/ui/EmptyState";
import { getMyOrders } from "@/lib/orders/mine";

export const metadata: Metadata = {
  title: "My Orders",
  description: "Track your DPC Gadget Hub orders and their delivery status.",
};

export default async function OrdersPage() {
  let orders;
  try {
    orders = await getMyOrders();
  } catch {
    return (
      <div className="container-page py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My orders
        </h1>
        <div className="mt-8">
          <EmptyState
            title="Could not load your orders"
            description="Something went wrong. Check your connection and try again."
          />
        </div>
      </div>
    );
  }

  if (orders === null) {
    return (
      <div className="container-page py-10">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          My orders
        </h1>
        <div className="mt-8">
          <EmptyState
            title="Order history is unavailable"
            description="The shop database is not connected yet. Your orders will appear here once setup is complete."
            actionLabel="Back to shop"
            actionHref="/shop"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-3xl py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        My orders
      </h1>
      <p className="mt-2 text-sm text-muted">
        {orders.length === 0
          ? "You have not placed any orders yet."
          : `${orders.length} order${orders.length === 1 ? "" : "s"} — newest first.`}
      </p>
      <div className="mt-8">
        {orders.length === 0 ? (
          <EmptyState
            title="No orders yet"
            description="When you place an order it will show up here with its delivery status."
            actionLabel="Start shopping"
            actionHref="/shop"
          />
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
