"use client";

import { cn } from "@/lib/utils";

export default function QuantitySelector({
  value,
  onChange,
  max,
  min = 1,
  id = "quantity",
}: {
  value: number;
  onChange: (next: number) => void;
  max: number;
  min?: number;
  id?: string;
}) {
  const clamp = (n: number) => Math.min(Math.max(n, min), Math.max(max, min));

  return (
    <div className="inline-flex items-center rounded-lg border border-line bg-surface">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
        className="px-3 py-2 text-lg text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={min}
        max={Math.max(max, min)}
        value={value}
        onChange={(event) => {
          const parsed = Number.parseInt(event.target.value, 10);
          onChange(Number.isNaN(parsed) ? min : clamp(parsed));
        }}
        aria-label="Quantity"
        className="w-14 border-x border-line bg-transparent py-2 text-center text-sm text-ink focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={cn(
          "px-3 py-2 text-lg text-muted transition-colors hover:text-ink disabled:cursor-not-allowed disabled:opacity-40",
        )}
      >
        +
      </button>
    </div>
  );
}