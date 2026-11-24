import type { Metadata } from "next";
import Link from "next/link";
import { Check, Package } from "lucide-react";
import { getStoreInfo } from "@/lib/store-info";
import { waHref } from "@/lib/store-types";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNo = searchParams.order ?? "";
  const waMsg = `Hi Dorika, I just placed order ${orderNo}. I'd like to confirm it.`;

  // Shop-wide payment destinations. Deliberately not order-specific so this
  // public page never reveals an order's contents to a guessed URL.
  const [settings, store] = await Promise.all([getSettings(), getStoreInfo()]);
  const hasManualPayment = Boolean(
    settings?.esewa_id || settings?.khalti_id || settings?.bank_account_number
  );

  return (
    <div className="bg-cream-100">
      <div className="container-page flex min-h-[70vh] items-center justify-center py-16">
        <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-100 bg-white p-8 text-center shadow-card">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="mt-5 text-3xl font-extrabold">Thank you for your order!</h1>
          <p className="mt-2 text-charcoal-500">
            We&apos;ve received your order and will confirm it shortly.
          </p>

          {orderNo && (
            <div className="mt-6 rounded-xl bg-cream-200 p-5">
              <p className="text-sm text-charcoal-400">Your Order ID</p>
              <p className="text-2xl font-extrabold tracking-wide text-terracotta-600">{orderNo}</p>
            </div>
          )}

          {hasManualPayment && (
            <div className="mt-6 rounded-xl border border-charcoal-100 p-4 text-left">
              <p className="font-semibold text-charcoal-800">Paying by eSewa / Khalti / bank transfer?</p>
              <div className="mt-2 space-y-1 text-sm text-charcoal-500">
                {settings?.esewa_id && (
                  <p>eSewa: <span className="font-mono font-semibold text-charcoal-800">{settings.esewa_id}</span></p>
                )}
                {settings?.khalti_id && (
                  <p>Khalti: <span className="font-mono font-semibold text-charcoal-800">{settings.khalti_id}</span></p>
                )}
                {settings?.bank_account_number && (
                  <p>
                    {settings.bank_name ?? "Bank"}:{" "}
                    <span className="font-mono font-semibold text-charcoal-800">
                      {settings.bank_account_number}
                    </span>
                    {settings.bank_account_name ? ` (${settings.bank_account_name})` : ""}
                  </p>
                )}
                {settings?.payment_note && <p className="text-xs">{settings.payment_note}</p>}
              </div>
              <p className="mt-2 text-xs text-charcoal-400">
                Send the screenshot and your order ID on WhatsApp so we can confirm it faster.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={waHref(store, waMsg)}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary btn-lg flex-1 !bg-whatsapp hover:!brightness-110"
            >
              Confirm on WhatsApp
            </a>
            <Link href={`/track?order=${orderNo}`} className="btn-outline btn-lg flex-1">
              <Package className="h-4 w-4" /> Track your order
            </Link>
          </div>

          <Link href="/shop" className="btn-ghost btn-md mt-6">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
