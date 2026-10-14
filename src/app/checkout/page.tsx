import type { Metadata } from "next";
import CheckoutClient from "@/components/checkout/CheckoutClient";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Enter your delivery details and place your order.",
};

export default function CheckoutPage() {
  return (
    <div className="container-page py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
        Checkout
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sign-in is required — your order is linked to your Google account.
      </p>
      <div className="mt-8">
        <CheckoutClient />
      </div>
    </div>
  );
}
