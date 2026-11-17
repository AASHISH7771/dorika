import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone, Printer, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge, PaymentBadge } from "@/components/admin/ui";
import { formatNPR, formatDateTime, statusLabel, normalizePhone } from "@/lib/utils";
import { productImage } from "@/lib/config";
import type { Order } from "@/lib/types";
import { updateOrderStatus, updateOrderPayment } from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "in_progress", "shipped", "delivered", "cancelled"] as const;
const PAYMENTS = ["unpaid", "pending", "paid", "refunded", "failed"] as const;
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  cod: "Cash on Delivery",
  esewa: "eSewa",
  khalti: "Khalti",
  bank_transfer: "Bank Transfer",
};

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("orders")
    .select("*, order_items(*), order_events(status, note, created_at)")
    .eq("id", params.id)
    .single();

  const order = data as Order | null;
  if (!order) notFound();

  const events = [...(order.order_events ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const waPhone = normalizePhone(order.phone).replace(/^977/, "");
  const waUrl = `https://wa.me/977${waPhone}?text=${encodeURIComponent(
    `Hi ${order.customer_name}, this is Dorika regarding your order ${order.order_no}.`
  )}`;

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/orders" className="btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" /> Orders
        </Link>
        <div className="flex gap-2">
          <a href={waUrl} target="_blank" className="btn-outline btn-sm">
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
          <Link href={`/admin/orders/${order.id}/invoice`} target="_blank" className="btn-outline btn-sm">
            <Printer className="h-4 w-4" /> Invoice
          </Link>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{order.order_no}</h1>
        <StatusBadge status={order.status} />
        <PaymentBadge status={order.payment_status} />
        <span className="text-sm text-charcoal-400">{formatDateTime(order.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: items + customer */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <h2 className="border-b border-charcoal-100 px-5 py-3 font-extrabold">Items</h2>
            <div className="divide-y divide-charcoal-100">
              {(order.order_items ?? []).map((it) => (
                <div key={it.id} className="flex items-center gap-4 px-5 py-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                    <Image
                      src={it.image_url || productImage(null)}
                      alt={it.product_name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-charcoal-800">{it.product_name}</p>
                    <p className="text-xs text-charcoal-400">
                      {formatNPR(it.unit_price)} × {it.quantity}
                    </p>
                  </div>
                  <p className="font-semibold">{formatNPR(it.line_total)}</p>
                </div>
              ))}
            </div>
            <div className="space-y-1 border-t border-charcoal-100 px-5 py-4 text-sm">
              <div className="flex justify-between text-charcoal-500">
                <span>Subtotal</span>
                <span>{formatNPR(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-charcoal-500">
                <span>Delivery</span>
                <span>{order.delivery_fee === 0 ? "Free" : formatNPR(order.delivery_fee)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-extrabold text-charcoal-800">
                <span>Total</span>
                <span>{formatNPR(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-extrabold">Customer</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Name" value={order.customer_name} />
              <Row
                label="Phone"
                value={
                  <a href={`tel:${order.phone}`} className="inline-flex items-center gap-1 text-terracotta-600 hover:underline">
                    <Phone className="h-3.5 w-3.5" /> {order.phone}
                  </a>
                }
              />
              {order.email && <Row label="Email" value={order.email} />}
              <Row label="Payment method" value={PAYMENT_METHOD_LABEL[order.payment_method] ?? order.payment_method} />
              {order.district && <Row label="District" value={order.district} />}
              {order.city && <Row label="City" value={order.city} />}
              {order.address && <Row label="Address" value={order.address} full />}
              {order.landmark && <Row label="Landmark" value={order.landmark} />}
              {order.notes && <Row label="Notes" value={order.notes} full />}
            </dl>
          </div>
        </div>

        {/* Right: status controls + timeline */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-extrabold">Update status</h2>
            <form action={updateOrderStatus} className="space-y-3">
              <input type="hidden" name="id" value={order.id} />
              <select name="status" defaultValue={order.status} className="input text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
              <textarea
                name="note"
                placeholder="Optional note (shown to the customer on /track)"
                className="input min-h-[70px] resize-y text-sm"
              />
              <button type="submit" className="btn-primary btn-sm w-full">
                Save status
              </button>
            </form>

            <form action={updateOrderPayment} className="mt-5 space-y-3 border-t border-charcoal-100 pt-5">
              <input type="hidden" name="id" value={order.id} />
              <label className="label">Payment status</label>
              <select name="payment_status" defaultValue={order.payment_status} className="input text-sm">
                {PAYMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-dark btn-sm w-full">
                Save payment
              </button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-extrabold">Timeline</h2>
            {events.length === 0 ? (
              <p className="text-sm text-charcoal-400">No events yet.</p>
            ) : (
              <ol className="space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-terracotta-500" />
                    {i < events.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-charcoal-100" />
                    )}
                    <p className="text-sm font-semibold">{statusLabel[e.status]}</p>
                    {e.note && <p className="text-xs text-charcoal-500">{e.note}</p>}
                    <p className="text-xs text-charcoal-400">{formatDateTime(e.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, full }: { label: string; value: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <dt className="text-xs uppercase tracking-wide text-charcoal-400">{label}</dt>
      <dd className="text-charcoal-700">{value}</dd>
    </div>
  );
}
