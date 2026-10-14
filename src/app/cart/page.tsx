import type { Metadata } from "next";
import CartClient from "@/components/cart/CartClient";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review the gadgets in your cart before checkout.",
};

export default function CartPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Your cart
      </h1>
      <p className="mt-2 text-sm text-muted">
        Saved on this device — sign in at checkout to sync it to your account.
      </p>
      <div className="mt-8">
        <CartClient />
      </div>
    </div>
  );
}
