import type { Metadata } from "next";
import Link from "next/link";
import { Check, Package, UserPlus } from "lucide-react";
import { siteConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNo = searchParams.order ?? "";
  const waMsg = `Hi Dorika, I just placed order ${orderNo}. I'd like to confirm it.`;

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

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(waMsg)}`}
              target="_blank" rel="noopener noreferrer"
              className="btn-primary btn-lg flex-1 !bg-whatsapp hover:!brightness-110"
            >
              Confirm on WhatsApp
            </a>
            <Link href={`/track?order=${orderNo}`} className="btn-outline btn-lg flex-1">
              <Package className="h-4 w-4" /> Track your order
            </Link>
          </div>

          {/* Soft, optional account prompt */}
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-charcoal-100 p-4 text-left">
            <UserPlus className="mt-0.5 h-5 w-5 flex-shrink-0 text-terracotta-500" />
            <p className="text-sm text-charcoal-500">
              <span className="font-semibold text-charcoal-700">Want to save your details?</span>{" "}
              Creating an account is optional — it lets you see your order history and
              reuse your address next time.{" "}
              <Link href="/account/auth/signup" className="font-semibold text-terracotta-600 hover:underline">
                Create account
              </Link>
            </p>
          </div>

          <Link href="/shop" className="btn-ghost btn-md mt-6">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
