import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { WishlistClient } from "@/components/wishlist/wishlist-client";

export const metadata: Metadata = pageMetadata({
  title: "Your Wishlist",
  description: "Your saved Dorika pieces, stored on this device. No account required.",
  path: "/wishlist",
  // Per-visitor content held in localStorage — nothing to index.
  noindex: true,
});

export default function WishlistPage() {
  return <WishlistClient />;
}
