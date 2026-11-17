import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard, PaymentBadge, EmptyState } from "@/components/admin/ui";
import { AdminFilters } from "@/components/admin/admin-filters";
import { formatNPR, formatDate } from "@/lib/utils";
import { updateOrderPayment } from "../orders/actions";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

const METHOD_LABEL: Record<string, string> = {
  cod: "Cash on Delivery",
  esewa: "eSewa",
  khalti: "Khalti",
  bank_transfer: "Bank Transfer",
};

export default async function PaymentsPage({ searchParams }: { searchParams: { payment?: string } }) {
  const supabase = createClient();

  let query = supabase
    .from("orders")
    .select("id, order_no, customer_name, total, payment_method, payment_status, status, created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (searchParams.payment) query = query.eq("payment_status", searchParams.payment);

  const { data } = await query;
  const orders = (data as Order[]) ?? [];

  // Totals (all non-cancelled)
  const active = orders.filter((o) => o.status !== "cancelled");
  const paid = active.filter((o) => o.payment_status === "paid").reduce((s, o) => s + Number(o.total), 0);
  const pending = active
    .filter((o) => o.payment_status === "pending" || o.payment_status === "unpaid")
    .reduce((s, o) => s + Number(o.total), 0);

  const byMethod = new Map<string, number>();
  active.forEach((o) => byMethod.set(o.payment_method, (byMethod.get(o.payment_method) ?? 0) + Number(o.total)));

  return (
    <>
      <PageHeader title="Payments" subtitle="Payment overview and reconciliation" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Collected (paid)" value={formatNPR(paid)} accent />
        <StatCard label="Outstanding" value={formatNPR(pending)} />
        {Array.from(byMethod.entries()).slice(0, 2).map(([m, v]) => (
          <StatCard key={m} label={METHOD_LABEL[m] ?? m} value={formatNPR(v)} />
        ))}
      </div>

      <div className="mt-6">
        <AdminFilters showPayment searchPlaceholder="(use payment filter)" />
      </div>

      {orders.length === 0 ? (
        <EmptyState title="No payments yet" />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Method</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-charcoal-800 hover:text-terracotta-600">
                        {o.order_no}
                      </Link>
                      <div className="text-xs text-charcoal-400">{o.customer_name}</div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-600">{METHOD_LABEL[o.payment_method] ?? o.payment_method}</td>
                    <td className="px-4 py-3 font-medium">{formatNPR(o.total)}</td>
                    <td className="px-4 py-3">
                      <PaymentBadge status={o.payment_status} />
                    </td>
                    <td className="px-4 py-3 text-charcoal-500">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      {o.payment_status !== "paid" && (
                        <form action={updateOrderPayment}>
                          <input type="hidden" name="id" value={o.id} />
                          <input type="hidden" name="payment_status" value="paid" />
                          <button type="submit" className="btn-outline btn-sm">
                            Mark paid
                          </button>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
