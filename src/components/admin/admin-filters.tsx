"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { useState, useEffect } from "react";

// A compact, reusable filter bar for admin list pages (orders, custom requests,
// payments). Syncs state to the URL so server components can read it.
export function AdminFilters({
  statuses,
  showPayment = false,
  searchPlaceholder = "Search…",
}: {
  statuses?: { value: string; label: string }[];
  showPayment?: boolean;
  searchPlaceholder?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [q, setQ] = useState(params.get("q") ?? "");

  useEffect(() => {
    setQ(params.get("q") ?? "");
  }, [params]);

  function apply(next: Record<string, string>) {
    const sp = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k, v]) => {
      if (v) sp.set(k, v);
      else sp.delete(k);
    });
    sp.delete("page");
    router.push(`${pathname}?${sp.toString()}`);
  }

  const paymentStatuses = [
    { value: "unpaid", label: "Unpaid" },
    { value: "pending", label: "Pending" },
    { value: "paid", label: "Paid" },
    { value: "refunded", label: "Refunded" },
    { value: "failed", label: "Failed" },
  ];

  const hasFilters =
    params.get("q") || params.get("status") || params.get("payment") || params.get("from") || params.get("to");

  return (
    <div className="mb-5 flex flex-wrap items-center gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="relative min-w-[200px] flex-1"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={searchPlaceholder}
          className="input !py-2 pl-9 text-sm"
        />
      </form>

      {statuses && (
        <select
          value={params.get("status") ?? ""}
          onChange={(e) => apply({ status: e.target.value })}
          className="input !w-auto !py-2 text-sm"
        >
          <option value="">All statuses</option>
          {statuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {showPayment && (
        <select
          value={params.get("payment") ?? ""}
          onChange={(e) => apply({ payment: e.target.value })}
          className="input !w-auto !py-2 text-sm"
        >
          <option value="">All payments</option>
          {paymentStatuses.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      )}

      {hasFilters && (
        <button
          onClick={() => router.push(pathname)}
          className="btn-ghost btn-sm"
          aria-label="Clear filters"
        >
          <X className="h-4 w-4" /> Clear
        </button>
      )}
    </div>
  );
}
