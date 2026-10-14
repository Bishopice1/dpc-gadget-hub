import { z } from "zod";

/** Cart line passed from client to server (Phase 3 checkout + cart sync). */
export const cartItemSchema = z.object({
  product_id: z.string().uuid("Invalid product id"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99"),
});

export const cartSyncSchema = z.object({
  items: z.array(cartItemSchema).max(50, "Cart has too many lines"),
});

export type CartSyncInput = z.infer<typeof cartSyncSchema>;