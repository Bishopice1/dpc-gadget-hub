"use client";

import { useEffect, useState } from "react";
import QuantitySelector from "@/components/product/QuantitySelector";
import { useCart } from "@/components/cart/CartProvider";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function ProductPurchase({ product }: { product: Product }) {
  const outOfStock = product.stock <= 0;
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(timer);
  }, [added]);

  function handleAdd() {
    if (outOfStock) return;
    addItem(
      {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price_ngn: product.price_ngn,
        image_url: product.image_urls[0] ?? "/products/placeholder.svg",
        stock: product.stock,
      },
      quantity,
    );
    setAdded(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <label
          htmlFor="quantity"
          className="text-sm font-medium text-muted"
        >
          Quantity
        </label>
        <QuantitySelector
          id="quantity"
          value={quantity}
          onChange={setQuantity}
          max={Math.max(product.stock, 1)}
        />
        {!outOfStock && (
          <span className="text-xs text-muted">
            {formatNaira(product.price_ngn * quantity)}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={handleAdd}
        disabled={outOfStock}
        aria-live="polite"
        className={cn(
          "rounded-xl px-6 py-3.5 text-sm font-semibold transition-colors",
          outOfStock
            ? "cursor-not-allowed bg-surface-2 text-muted"
            : added
              ? "bg-accent-hover text-white"
              : "bg-accent text-white hover:bg-accent-hover hover:text-white",
        )}
      >
        {outOfStock
          ? "Out of stock"
          : added
            ? "Added to cart ✓"
            : "Add to cart"}
      </button>
    </div>
  );
}