import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatusBadge, PaymentBadge, EmptyState } from "@/components/admin/ui";
import { AdminFilters } from "@/components/admin/admin-filters";
import { formatNPR, formatDate, statusLabel } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const PER_PAGE = 20;

const STATUS_OPTIONS = (["pending", "confirmed", "in_progress", "shipped", "delivered", "cancelled"] as const).map(
  (s) => ({ value: s, label: statusLabel[s] })
);

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; payment?: string; page?: string };
}) {
  const supabase = createClient();
  const page = Math.max(1, Number(searchParams.page ?? 1));
  const from = (page - 1) * PER_PAGE;

  let query = supabase
    .from("orders")
    .select(
      "id, order_no, customer_name, phone, total, payment_method, payment_status, status, created_at",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (searchParams.q) {
    const q = searchParams.q.replace(/[%,]/g, "");
    query = query.or(`order_no.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.payment) query = query.eq("payment_status", searchParams.payment);

  const { data, count } = await query.range(from, from + PER_PAGE - 1);
  const orders = (data as Order[]) ?? [];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  const exportHref = `/api/admin/export?type=orders${searchParams.status ? `&status=${searchParams.status}` : ""}${searchParams.payment ? `&payment=${searchParams.payment}` : ""}${searchParams.q ? `&q=${encodeURIComponent(searchParams.q)}` : ""}`;

  return (
    <>
      <PageHeader
        title="Orders"
        subtitle={`${total} order${total === 1 ? "" : "s"}`}
        action={
          <a href={exportHref} className="btn-outline btn-sm">
            <Download className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <AdminFilters statuses={STATUS_OPTIONS} showPayment searchPlaceholder="Order no, name or phone…" />

      {orders.length === 0 ? (
        <EmptyState title="No orders found" hint="Try clearing the filters, or wait for your first order." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-charcoal-800 hover:text-terracotta-600"
                      >
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-charcoal-700">{o.customer_name}</div>
                      <div className="text-xs text-charcoal-400">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-500">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{formatNPR(o.total)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            const sp = new URLSearchParams(searchParams as Record<string, string>);
            sp.set("page", String(p));
            return (
              <Link
                key={p}
                href={`/admin/orders?${sp.toString()}`}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-semibold " +
                  (p === page ? "bg-terracotta-500 text-white" : "bg-white text-charcoal-600 hover:bg-cream-200")
                }
              >
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
