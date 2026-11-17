import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { StatusBadge, PageHeader } from "@/components/admin/ui";
import { formatNPR, formatDate } from "@/lib/utils";
import type { Order, CustomRequest, Address } from "@/lib/types";

export interface CustomerView {
  name: string;
  phone: string;
  email: string | null;
  type: "Registered" | "Guest";
  joined?: string | null;
  orders: Order[];
  customRequests: CustomRequest[];
  addresses: Address[];
}

export function CustomerDetail({ customer }: { customer: CustomerView }) {
  const spent = customer.orders
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  return (
    <>
      <Link href="/admin/customers" className="btn-ghost btn-sm mb-4">
        <ArrowLeft className="h-4 w-4" /> Customers
      </Link>
      <PageHeader
        title={customer.name}
        subtitle={`${customer.type} · ${customer.phone}${customer.email ? ` · ${customer.email}` : ""}`}
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold">{customer.orders.length}</p>
          <p className="text-xs text-charcoal-400">Orders</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold">{formatNPR(spent)}</p>
          <p className="text-xs text-charcoal-400">Total spent</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-extrabold">{customer.customRequests.length}</p>
          <p className="text-xs text-charcoal-400">Custom requests</p>
        </div>
      </div>

      {customer.addresses.length > 0 && (
        <div className="card mb-6 p-5">
          <h2 className="mb-3 font-extrabold">Saved addresses</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {customer.addresses.map((a) => (
              <div key={a.id} className="rounded-xl bg-cream-200 p-3 text-sm">
                <p className="font-semibold">
                  {a.label || "Address"} {a.is_default && <span className="text-xs text-terracotta-600">(default)</span>}
                </p>
                <p className="text-charcoal-600">
                  {[a.address, a.city, a.district].filter(Boolean).join(", ")}
                </p>
                {a.phone && <p className="text-charcoal-400">{a.phone}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card mb-6 overflow-hidden">
        <h2 className="border-b border-charcoal-100 px-5 py-3 font-extrabold">Order history</h2>
        {customer.orders.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-charcoal-400">No orders.</p>
        ) : (
          <div className="divide-y divide-charcoal-100">
            {customer.orders.map((o) => (
              <Link
                key={o.id}
                href={`/admin/orders/${o.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-cream-100"
              >
                <div>
                  <span className="font-semibold text-charcoal-800">{o.order_no}</span>
                  <span className="ml-2 text-xs text-charcoal-400">{formatDate(o.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatNPR(o.total)}</span>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {customer.customRequests.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="border-b border-charcoal-100 px-5 py-3 font-extrabold">Custom art requests</h2>
          <div className="divide-y divide-charcoal-100">
            {customer.customRequests.map((r) => (
              <Link
                key={r.id}
                href={`/admin/custom-requests/${r.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-cream-100"
              >
                <div>
                  <span className="font-semibold text-charcoal-800">{r.request_no}</span>
                  <span className="ml-2 text-xs text-charcoal-400">{formatDate(r.created_at)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">{formatNPR(r.price)}</span>
                  <StatusBadge status={r.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
