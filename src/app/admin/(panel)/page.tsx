import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, StatCard, StatusBadge } from "@/components/admin/ui";
import { SalesChart, type SalesBuckets } from "@/components/admin/sales-chart";
import { formatNPR, formatDate } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

type OrderRow = Pick<
  Order,
  "id" | "order_no" | "customer_name" | "total" | "status" | "created_at"
>;

function startOf(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d;
}

function buildBuckets(orders: { total: number; created_at: string; status: string }[]): SalesBuckets {
  const paid = orders.filter((o) => o.status !== "cancelled");

  // Daily — last 14 days
  const daily: SalesBuckets["daily"] = [];
  for (let i = 13; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const rows = paid.filter((o) => {
      const t = new Date(o.created_at);
      return t >= day && t < next;
    });
    daily.push({
      label: day.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: rows.reduce((s, o) => s + Number(o.total), 0),
      orders: rows.length,
    });
  }

  // Weekly — last 8 weeks
  const weekly: SalesBuckets["weekly"] = [];
  for (let i = 7; i >= 0; i--) {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - start.getDay() - i * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    const rows = paid.filter((o) => {
      const t = new Date(o.created_at);
      return t >= start && t < end;
    });
    weekly.push({
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: rows.reduce((s, o) => s + Number(o.total), 0),
      orders: rows.length,
    });
  }

  // Monthly — last 6 months
  const monthly: SalesBuckets["monthly"] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    start.setMonth(start.getMonth() - i);
    const end = new Date(start);
    end.setMonth(start.getMonth() + 1);
    const rows = paid.filter((o) => {
      const t = new Date(o.created_at);
      return t >= start && t < end;
    });
    monthly.push({
      label: start.toLocaleDateString("en-US", { month: "short" }),
      revenue: rows.reduce((s, o) => s + Number(o.total), 0),
      orders: rows.length,
    });
  }

  return { daily, weekly, monthly };
}

export default async function AdminDashboard() {
  const supabase = createClient();

  // Pull a bounded window of orders for stats + chart (90 days).
  const since = startOf(90).toISOString();
  const [{ data: recentOrdersData }, { data: windowOrders }, lowStock, pendingCustom] =
    await Promise.all([
      supabase
        .from("orders")
        .select("id, order_no, customer_name, total, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("orders")
        .select("total, status, created_at")
        .gte("created_at", since),
      supabase
        .from("products")
        .select("id, name, stock")
        .eq("is_active", true)
        .lte("stock", 5)
        .order("stock", { ascending: true })
        .limit(6),
      supabase
        .from("custom_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const allOrders = (windowOrders as { total: number; status: string; created_at: string }[]) ?? [];
  const recentOrders = (recentOrdersData as OrderRow[]) ?? [];
  const lowStockRows = (lowStock.data as { id: string; name: string; stock: number }[]) ?? [];

  const revenue = allOrders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  const now = new Date();
  const todayStart = startOf(0);
  const weekStart = startOf(7);
  const monthStart = startOf(30);
  const countSince = (d: Date) => allOrders.filter((o) => new Date(o.created_at) >= d).length;

  const pendingOrders = allOrders.filter((o) => o.status === "pending").length;
  const buckets = buildBuckets(allOrders);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview · ${now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}`}
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Revenue (90d)" value={formatNPR(revenue)} accent />
        <StatCard label="Orders today" value={countSince(todayStart)} sub={`${countSince(weekStart)} this week`} />
        <StatCard label="Orders (30d)" value={countSince(monthStart)} />
        <StatCard label="Pending orders" value={pendingOrders} sub={`${pendingCustom.count ?? 0} custom pending`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesChart data={buckets} />
        </div>

        {/* Low stock */}
        <div className="card p-5">
          <h2 className="mb-4 text-lg font-extrabold">Low stock</h2>
          {lowStockRows.length === 0 ? (
            <p className="text-sm text-charcoal-400">Everything is well stocked.</p>
          ) : (
            <ul className="space-y-2">
              {lowStockRows.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-cream-200 px-3 py-2 text-sm"
                >
                  <Link href={`/admin/products/${p.id}/edit`} className="font-medium hover:text-terracotta-600">
                    {p.name}
                  </Link>
                  <span
                    className={
                      "badge " +
                      (p.stock <= 0 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-800")
                    }
                  >
                    {p.stock} left
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders */}
      <div className="card mt-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-charcoal-100 px-5 py-4">
          <h2 className="text-lg font-extrabold">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm font-semibold text-terracotta-600 hover:underline">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-charcoal-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-5 py-3 font-semibold">Order</th>
                  <th className="px-5 py-3 font-semibold">Customer</th>
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Total</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-cream-100">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-semibold text-charcoal-800 hover:text-terracotta-600"
                      >
                        {o.order_no}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-charcoal-600">{o.customer_name}</td>
                    <td className="px-5 py-3 text-charcoal-500">{formatDate(o.created_at)}</td>
                    <td className="px-5 py-3 font-medium">{formatNPR(o.total)}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
