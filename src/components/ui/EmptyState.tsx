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
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-accent/40 bg-gradient-to-b from-white to-accent-soft/40 px-6 py-16 text-center">
      <span aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm ring-1 ring-accent/20">
        🔍
      </span>
      <p className="text-lg font-extrabold text-navy">{title}</p>
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