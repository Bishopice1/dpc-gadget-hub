import type { PaymentMethod } from "@/lib/validation/checkout";

/**
 * Payment provider abstraction.
 * Today only offline methods exist (pay on delivery / bank transfer), which
 * need no provider interaction — but checkout and order code talks to this
 * interface so Paystack (or another gateway) can be dropped in later without
 * touching the order flow:
 *
 *   1. Implement `PaymentProvider` for Paystack (initialize transaction,
 *      verify reference, webhook handler).
 *   2. Register it in `paymentProviders` below.
 *   3. Add "paystack" to `paymentMethodSchema` and the checkout UI.
 */
export interface PaymentInit {
  /** Amount in whole Naira. */
  amount_ngn: number;
  order_number: string;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
}

export interface PaymentResult {
  ok: boolean;
  /** Provider reference (e.g. Paystack reference) when applicable. */
  reference?: string;
  message?: string;
}

export interface PaymentProvider {
  readonly method: PaymentMethod;
  readonly label: string;
  /** Human-readable instructions shown at checkout / confirmation. */
  readonly instructions: string;
  /** Whether this method needs an online step before the order is placed. */
  readonly requiresOnlineStep: boolean;
  initialize(payment: PaymentInit): Promise<PaymentResult>;
}

class PayOnDeliveryProvider implements PaymentProvider {
  readonly method: PaymentMethod = "pay_on_delivery";
  readonly label = "Pay on delivery";
  readonly instructions =
    "Pay with cash or bank transfer when your order arrives. Please have the exact amount ready and inspect your items before paying.";
  readonly requiresOnlineStep = false;

  async initialize(): Promise<PaymentResult> {
    return { ok: true };
  }
}

class BankTransferProvider implements PaymentProvider {
  readonly method: PaymentMethod = "bank_transfer";
  readonly label = "Bank transfer";
  readonly instructions =
    "Transfer the order total to the shop account shared after checkout, then send your receipt on WhatsApp. Your order is confirmed once payment is verified.";
  readonly requiresOnlineStep = false;

  async initialize(): Promise<PaymentResult> {
    return { ok: true };
  }
}

export const paymentProviders: Record<PaymentMethod, PaymentProvider> = {
  pay_on_delivery: new PayOnDeliveryProvider(),
  bank_transfer: new BankTransferProvider(),
};

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string; hint: string }[] = [
  {
    value: "pay_on_delivery",
    label: "Pay on delivery",
    hint: "Cash or transfer when your order arrives",
  },
  {
    value: "bank_transfer",
    label: "Bank transfer",
    hint: "Transfer before delivery, confirmed on WhatsApp",
  },
];

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return paymentProviders[method];
}
