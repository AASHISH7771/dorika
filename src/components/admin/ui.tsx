import { statusColor, statusLabel } from "@/lib/utils";
import type { OrderStatus, PaymentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-charcoal-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={cn("badge", statusColor[status])}>{statusLabel[status]}</span>
  );
}

const PAYMENT_COLORS: Record<PaymentStatus, string> = {
  unpaid: "bg-charcoal-100 text-charcoal-600",
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-blue-100 text-blue-800",
  failed: "bg-red-100 text-red-800",
};
const PAYMENT_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  pending: "Pending",
  paid: "Paid",
  refunded: "Refunded",
  failed: "Failed",
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn("badge", PAYMENT_COLORS[status])}>{PAYMENT_LABELS[status]}</span>;
}

export function EmptyState({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white/60 px-6 py-16 text-center">
      <h3 className="text-lg font-bold text-charcoal-700">{title}</h3>
      {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-charcoal-400">{hint}</p>}
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-soft",
        accent
          ? "border-terracotta-200 bg-terracotta-50"
          : "border-charcoal-100 bg-white"
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-charcoal-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-charcoal-400">{sub}</p>}
    </div>
  );
}
