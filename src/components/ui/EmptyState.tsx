import Link from "next/link";
import type { ReactNode } from "react";

export default function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  children,
}: {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && (
        <p className="max-w-md text-sm leading-relaxed text-muted">
          {description}
        </p>
      )}
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="mt-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {actionLabel}
        </Link>
      )}
      {children}
    </div>
  );
}