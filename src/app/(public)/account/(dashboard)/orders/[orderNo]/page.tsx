import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MessageCircle } from "lucide-react";
import { requireCustomerSession } from "@/lib/auth";
import { getAccountOrder } from "@/lib/account-queries";
import { StatusBadge, PaymentBadge } from "@/components/admin/ui";
import { MoneyRow } from "@/components/account/ui";
import {
  STATUS_FLOW,
  cn,
  formatDateTime,
  formatNPR,
  statusLabel,
} from "@/lib/utils";
import { siteConfig } from "@/lib/config";
import type { OrderStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

const PAYMENT_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  esewa: "eSewa",
  khalti: "Khalti",
  bank_transfer: "Bank transfer",
};

export default async function AccountOrderDetailPage({
  params,
}: {
  params: { orderNo: string };
}) {
  const session = await requireCustomerSession();
  const order = await getAccountOrder(session.userId, params.orderNo);

  if (!order) notFound();

  const cancelled = order.status === "cancelled";
  const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
  const waMessage = `Hi Dorika, I have a question about my order ${order.order_no}.`;

  return (
    <>
      <div className="mb-5">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-500 hover:text-terracotta-600"
        >
          <ArrowLeft className="h-4 w-4" /> All orders
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-[28px]">{order.order_no}</h1>
          <p className="mt-1 text-sm text-charcoal-400">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PaymentBadge status={order.payment_status} />
          <StatusBadge status={order.status} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_300px]">
        {/* Items */}
        <div className="space-y-4">
          <div className="card overflow-hidden">
            <div className="border-b border-charcoal-100 px-4 py-3">
              <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-500">
                Items ({order.items.length})
              </h2>
            </div>
            <ul className="divide-y divide-charcoal-100">
              {order.items.map((item) => (
                <li key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-cream-300">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product_name}
                        width={56}
                        height={56}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xs font-bold text-charcoal-400">
                        {item.product_name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-charcoal-800">
                      {item.product_name}
                    </p>
                    <p className="text-xs text-charcoal-400">
                      {formatNPR(item.unit_price)} × {item.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold">{formatNPR(item.line_total)}</p>
                </li>
              ))}
            </ul>
            <div className="space-y-2 border-t border-charcoal-100 bg-cream-200/60 px-4 py-3.5">
              <MoneyRow label="Subtotal" value={order.subtotal} />
              <MoneyRow label="Delivery" value={order.delivery_fee} />
              <div className="flex items-center justify-between border-t border-charcoal-200 pt-2 text-sm">
                <span className="font-bold text-charcoal-700">Total</span>
                <span className="text-lg font-extrabold text-terracotta-600">
                  {formatNPR(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-4 sm:p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-charcoal-500">
              Progress
            </h2>
            {cancelled ? (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
                This order was cancelled. Message us on WhatsApp if that looks wrong.
              </div>
            ) : (
              <ol className="relative ml-3 border-l-2 border-charcoal-100">
                {STATUS_FLOW.map((status, i) => {
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  const event = order.events.find((e) => e.status === status);
                  return (
                    <li key={status} className="mb-5 ml-6 last:mb-0">
                      <span
                        className={cn(
                          "absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                          done
                            ? "border-terracotta-500 bg-terracotta-500 text-white"
                            : "border-charcoal-200 bg-white"
                        )}
                      >
                        {done ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-charcoal-200" />
                        )}
                      </span>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          current
                            ? "text-terracotta-600"
                            : done
                              ? "text-charcoal-800"
                              : "text-charcoal-300"
                        )}
                      >
                        {statusLabel[status]}
                      </p>
                      {event && (
                        <p className="text-xs text-charcoal-400">
                          {formatDateTime(event.created_at)}
                          {event.note ? ` · ${event.note}` : ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-500">
              Delivery
            </h2>
            <div className="mt-3 space-y-1 text-sm text-charcoal-600">
              <p className="font-semibold text-charcoal-800">{order.customer_name}</p>
              <p>{order.phone}</p>
              {order.email && <p className="break-all">{order.email}</p>}
              <p className="pt-1 leading-relaxed">
                {[order.address, order.city, order.district].filter(Boolean).join(", ")}
                {order.landmark ? ` (near ${order.landmark})` : ""}
              </p>
            </div>
            {order.notes && (
              <p className="mt-3 rounded-lg bg-cream-200 p-3 text-xs leading-relaxed text-charcoal-500">
                <span className="font-semibold text-charcoal-700">Note:</span> {order.notes}
              </p>
            )}
            <div className="mt-4 flex items-center justify-between border-t border-charcoal-100 pt-3 text-sm">
              <span className="text-charcoal-500">Payment</span>
              <span className="font-semibold">{PAYMENT_LABEL[order.payment_method] ?? order.payment_method}</span>
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="text-sm font-bold uppercase tracking-wide text-charcoal-500">Need help?</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-500">
              Send us your order number on WhatsApp and we&apos;ll pick it up from there.
            </p>
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(waMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-sm mt-4 w-full !bg-whatsapp hover:!brightness-110"
            >
              <MessageCircle className="h-4 w-4" /> Chat on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
