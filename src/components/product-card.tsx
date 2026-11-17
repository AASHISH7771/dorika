"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatNPR, cn } from "@/lib/utils";
import { productImage } from "@/lib/config";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const wished = has(product.id);
  const img = productImage(product.images, 0);
  const onSale = product.compare_at && product.compare_at > product.price;
  const soldOut = product.stock <= 0 && !product.is_custom;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-charcoal-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card">
      {/* Wishlist */}
      <button
        onClick={() => toggle(product.id)}
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 p-2 shadow-soft backdrop-blur transition hover:scale-110"
      >
        <Heart
          className={cn(
            "h-4 w-4 transition",
            wished ? "fill-terracotta-500 text-terracotta-500" : "text-charcoal-400"
          )}
        />
      </button>

      {/* Badges */}
      <div className="absolute left-3 top-3 z-10 flex flex-col gap-1.5">
        {product.is_custom && (
          <span className="badge bg-charcoal-800 text-white">Custom</span>
        )}
        {onSale && <span className="badge bg-terracotta-500 text-white">Sale</span>}
        {soldOut && <span className="badge bg-charcoal-200 text-charcoal-700">Sold out</span>}
      </div>

      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-cream-200">
        <Image
          src={img}
          alt={product.name}
          fill
          sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.category?.name && (
          <span className="mb-1 text-xs font-semibold uppercase tracking-wide text-terracotta-500">
            {product.category.name}
          </span>
        )}
        <Link
          href={`/product/${product.slug}`}
          className="line-clamp-2 font-semibold text-charcoal-800 transition hover:text-terracotta-600"
        >
          {product.name}
        </Link>

        <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-terracotta-500">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Handmade to order</span>
        </div>

        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            <span className="text-lg font-extrabold text-charcoal-800">
              {formatNPR(product.price)}
            </span>
            {onSale && (
              <span className="ml-1.5 text-sm text-charcoal-300 line-through">
                {formatNPR(product.compare_at!)}
              </span>
            )}
          </div>
          {product.is_custom ? (
            <Link
              href="/custom-art"
              className="btn-primary btn-sm !px-3"
              aria-label="Create your custom art"
            >
              Create
            </Link>
          ) : (
            <button
              disabled={soldOut}
              onClick={() =>
                addItem({
                  productId: product.id,
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: img,
                  size: product.size,
                  stock: product.stock,
                })
              }
              className="btn-primary btn-sm !px-3"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingBag className="h-4 w-4" />
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
