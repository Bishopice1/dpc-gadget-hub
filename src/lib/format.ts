const numberFormatter = new Intl.NumberFormat("en-NG", {
  maximumFractionDigits: 0,
});

/**
 * Formats a naira amount with thousands separators, e.g. 649000 -> "₦649,000".
 */
export function formatNaira(amount: number): string {
  return `₦${numberFormatter.format(Math.round(amount))}`;
}

const dateFormatter = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatDate(isoDate: string | Date): string {
  const date = typeof isoDate === "string" ? new Date(isoDate) : isoDate;
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return dateFormatter.format(date);
}