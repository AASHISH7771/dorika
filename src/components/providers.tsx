"use client";

import { CartProvider } from "@/lib/cart-context";
import { WishlistProvider } from "@/lib/wishlist-context";
import { CartDrawer } from "@/components/cart-drawer";
import { WhatsAppButton } from "@/components/whatsapp-button";

/** Wraps the app with client providers + global overlays (cart, WhatsApp). */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <CartDrawer />
        <WhatsAppButton />
      </WishlistProvider>
    </CartProvider>
  );
}
