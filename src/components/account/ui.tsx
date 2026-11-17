import Link from "next/link";
import { cn, formatNPR } from "@/lib/utils";

export function PanelHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-charcoal-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  icon,
  href,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">{label}</p>
        {icon && <span className="text-terracotta-400">{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-extrabold text-charcoal-800">{value}</p>
      {hint && <p className="mt-1 text-xs text-charcoal-400">{hint}</p>}
    </>
  );

  const className =
    "card block p-4 transition-shadow hover:shadow-card sm:p-5";

  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

export function Notice({
  kind,
  children,
}: {
  kind: "success" | "error" | "info";
  children: React.ReactNode;
}) {
  const styles = {
    success: "border-green-200 bg-green-50 text-green-800",
    error: "border-red-200 bg-red-50 text-red-700",
    info: "border-charcoal-200 bg-white text-charcoal-600",
  } as const;

  return (
    <div className={cn("mb-4 rounded-xl border px-4 py-3 text-sm font-medium", styles[kind])}>
      {children}
    </div>
  );
}

export function EmptyPanel({
  title,
  hint,
  actionLabel,
  actionHref,
}: {
  title: string;
  hint: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white/60 px-6 py-14 text-center">
      <h3 className="text-base font-bold text-charcoal-700">{title}</h3>
      <p className="mx-auto mt-1 max-w-sm text-sm text-charcoal-400">{hint}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="btn-primary btn-md mt-5">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

export function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal-500">{label}</span>
      <span className="font-semibold text-charcoal-700">{formatNPR(value)}</span>
    </div>
  );
}
