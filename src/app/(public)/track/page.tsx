import type { Metadata } from "next";
import { TrackClient } from "@/components/track/track-client";

export const metadata: Metadata = {
  title: "Track Your Order",
  description: "Enter your Order ID and phone number to see your order status — no account needed.",
};

export default function TrackPage() {
  return (
    <div className="bg-cream-100">
      <div className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-10 text-center">
          <p className="eyebrow mb-2">Order status</p>
          <h1 className="text-4xl font-extrabold">Track Your Order</h1>
          <p className="mx-auto mt-2 max-w-lg text-charcoal-400">
            No account needed — just enter your Order ID and the phone number you used.
          </p>
        </div>
      </div>
      <div className="container-page py-10">
        <TrackClient />
      </div>
    </div>
  );
}
