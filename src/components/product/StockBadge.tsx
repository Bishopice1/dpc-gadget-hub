import { cn } from "@/lib/utils";

/**
 * Stock chip used on product cards and detail pages.
 */
export default function StockBadge({
  stock,
  className,
}: {
  stock: number;
  className?: string;
}) {
  const config =
    stock <= 0
      ? { label: "Out of stock", classes: "bg-danger/15 text-danger" }
      : stock <= 5
        ? {
            label: `Only ${stock} left`,
            classes: "bg-warning/15 text-warning",
          }
        : { label: "In stock", classes: "bg-accent/15 text-accent" };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        config.classes,
        className,
      )}
    >
      {config.label}
    </span>
  );
}