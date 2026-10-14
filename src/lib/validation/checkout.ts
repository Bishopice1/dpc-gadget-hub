import { z } from "zod";
import { cartItemSchema } from "@/lib/validation/cart";

/**
 * Nigerian phone numbers: 0803..., +234803..., 234803... (11 digits national).
 * Normalized before validation: spaces, dashes and parentheses are stripped.
 */
export const nigerianPhoneSchema = z
  .string()
  .trim()
  .min(1, "Phone number is required")
  .transform((v) => v.replace(/[\s\-()]/g, ""))
  .refine(
    (v) => /^(\+?234|0)[789][01]\d{8}$/.test(v),
    "Enter a valid Nigerian phone number, e.g. 08031234567",
  );

export const paymentMethodSchema = z.enum(
  ["pay_on_delivery", "bank_transfer"],
  { message: "Choose a payment method" },
);

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;

export const checkoutSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(120, "Full name is too long"),
  phone: nigerianPhoneSchema,
  address: z
    .string()
    .trim()
    .min(8, "Delivery address must be at least 8 characters")
    .max(500, "Delivery address is too long"),
  city: z
    .string()
    .trim()
    .min(2, "City is required")
    .max(100, "City is too long"),
  state: z
    .string()
    .trim()
    .min(2, "State is required")
    .max(100, "State is too long"),
  note: z
    .string()
    .trim()
    .max(500, "Note is too long")
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  payment_method: paymentMethodSchema,
  items: z
    .array(cartItemSchema)
    .min(1, "Your cart is empty")
    .max(50, "Too many items in one order"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
