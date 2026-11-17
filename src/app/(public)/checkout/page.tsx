import type { Metadata } from "next";
import { CheckoutClient } from "@/components/checkout/checkout-client";
import { getSettings } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Guest checkout — no account required.",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <div className="bg-cream-100">
      <div className="container-page py-10">
        <h1 className="mb-8 text-3xl font-extrabold">Checkout</h1>
        <CheckoutClient settings={settings} />
      </div>
    </div>
  );
}
