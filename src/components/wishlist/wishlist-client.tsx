"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { useWishlist } from "@/lib/wishlist-context";
import type { Product } from "@/lib/types";

export function WishlistClient() {
  const { ids } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      if (ids.length === 0) {
        if (!cancelled) {
          setProducts([]);
          setLoading(false);
        }
        return;
      }
      try {
        const res = await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const data = await res.json();
        if (!cancelled) setProducts(data.products ?? []);
      } catch {
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [ids]);

  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="Saved for later"
          title="Your Wishlist"
          subtitle="Everything you've saved, kept right here on this device. No account needed."
        />

        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-cream-300"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-charcoal-100 bg-white p-10 text-center shadow-soft">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50">
              <Heart className="h-7 w-7 text-terracotta-500" />
            </div>
            <h3 className="text-xl font-extrabold">No saved items yet</h3>
            <p className="mt-2 text-charcoal-400">
              Tap the heart on any piece to save it here for later.
            </p>
            <Link href="/shop" className="btn-primary btn-md mt-6">
              Browse the shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
