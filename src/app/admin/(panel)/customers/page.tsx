import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { formatNPR, formatDate, normalizePhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface CustomerRow {
  key: string;
  href: string;
  name: string;
  phone: string;
  email: string | null;
  type: "Registered" | "Guest";
  orders: number;
  spent: number;
  last: string | null;
}

export default async function CustomersPage({ searchParams }: { searchParams: { q?: string } }) {
  const supabase = createClient();

  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, phone, created_at").eq("role", "customer"),
    supabase.from("orders").select("user_id, customer_name, phone, email, total, status, created_at"),
  ]);

  const orderRows =
    (orders as {
      user_id: string | null;
      customer_name: string;
      phone: string;
      email: string | null;
      total: number;
      status: string;
      created_at: string;
    }[]) ?? [];

  const map = new Map<string, CustomerRow>();

  // Registered customers
  (profiles as { id: string; full_name: string | null; email: string | null; phone: string | null; created_at: string }[] | null)?.forEach(
    (p) => {
      map.set(`u:${p.id}`, {
        key: `u:${p.id}`,
        href: `/admin/customers/${p.id}`,
        name: p.full_name || p.email || "Customer",
        phone: p.phone || "",
        email: p.email,
        type: "Registered",
        orders: 0,
        spent: 0,
        last: null,
      });
    }
  );

  // Fold orders in; guests keyed by normalised phone
  for (const o of orderRows) {
    let key: string;
    if (o.user_id && map.has(`u:${o.user_id}`)) {
      key = `u:${o.user_id}`;
    } else {
      const np = normalizePhone(o.phone);
      key = `g:${np}`;
      if (!map.has(key)) {
        map.set(key, {
          key,
          href: `/admin/customers/guest/${encodeURIComponent(np)}`,
          name: o.customer_name,
          phone: o.phone,
          email: o.email,
          type: "Guest",
          orders: 0,
          spent: 0,
          last: null,
        });
      }
    }
    const row = map.get(key)!;
    row.orders += 1;
    if (o.status !== "cancelled") row.spent += Number(o.total);
    if (!row.last || new Date(o.created_at) > new Date(row.last)) row.last = o.created_at;
    if (!row.phone) row.phone = o.phone;
    if (!row.email) row.email = o.email;
  }

  let rows = Array.from(map.values()).sort((a, b) => {
    if (!a.last) return 1;
    if (!b.last) return -1;
    return new Date(b.last).getTime() - new Date(a.last).getTime();
  });

  const q = searchParams.q?.toLowerCase().trim();
  if (q) {
    rows = rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.phone.includes(q) ||
        (r.email ?? "").toLowerCase().includes(q)
    );
  }

  return (
    <>
      <PageHeader title="Customers" subtitle={`${rows.length} customer${rows.length === 1 ? "" : "s"} (registered + guests)`} />

      <form className="mb-5" action="/admin/customers" method="get">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search name, phone or email…"
          className="input max-w-sm !py-2 text-sm"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState title="No customers yet" hint="Customers appear here after their first order." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Spent</th>
                  <th className="px-4 py-3 font-semibold">Last order</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {rows.map((r) => (
                  <tr key={r.key} className="hover:bg-cream-100">
                    <td className="px-4 py-3">
                      <Link href={r.href} className="font-medium text-charcoal-800 hover:text-terracotta-600">
                        {r.name}
                      </Link>
                      <div className="text-xs text-charcoal-400">
                        {r.phone}
                        {r.email ? ` · ${r.email}` : ""}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "badge " +
                          (r.type === "Registered"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-charcoal-100 text-charcoal-600")
                        }
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="px-4 py-3">{r.orders}</td>
                    <td className="px-4 py-3 font-medium">{formatNPR(r.spent)}</td>
                    <td className="px-4 py-3 text-charcoal-500">{r.last ? formatDate(r.last) : "—"}</td>
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
