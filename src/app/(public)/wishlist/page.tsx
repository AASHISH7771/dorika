import type { Metadata } from "next";
import { WishlistClient } from "@/components/wishlist/wishlist-client";

export const metadata: Metadata = {
  title: "Your Wishlist",
  description: "Your saved Dorika pieces — stored on this device, no account required.",
};

export default function WishlistPage() {
  return <WishlistClient />;
}
