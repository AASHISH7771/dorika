"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Heart, Zap, Check } from "lucide-react";
import type { Product } from "@/lib/types";
import { formatNPR, cn } from "@/lib/utils";
import { productGallery } from "@/lib/config";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";

export function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, setOpen } = useCart();
  const { has, toggle } = useWishlist();
  const images = productGallery(product.images);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const soldOut = product.stock <= 0 && !product.is_custom;
  const onSale = product.compare_at && product.compare_at > product.price;
  const wished = has(product.id);

  const cartPayload = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    image: images[0],
    size: product.size,
    stock: product.stock,
  };

  const handleAdd = () => {
    addItem(cartPayload, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };
  const handleBuyNow = () => {
    addItem(cartPayload, qty);
    setOpen(false);
    router.push("/checkout");
  };

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      {/* Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-200 shadow-soft">
          <Image
            src={images[active]}
            alt={product.name}
            fill
            priority
            sizes="(max-width:1024px) 100vw, 50vw"
            className="object-cover"
          />
          {onSale && (
            <span className="badge absolute left-4 top-4 bg-terracotta-500 text-white">Sale</span>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActive(i)}
                className={cn(
                  "relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border-2 transition",
                  active === i ? "border-terracotta-500" : "border-transparent opacity-70 hover:opacity-100"
                )}
                aria-label={`View image ${i + 1}`}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.category?.name && (
          <span className="eyebrow">{product.category.name}</span>
        )}
        <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{product.name}</h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="text-3xl font-extrabold text-charcoal-800">
            {formatNPR(product.price)}
          </span>
          {onSale && (
            <span className="text-lg text-charcoal-300 line-through">
              {formatNPR(product.compare_at!)}
            </span>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {product.size && (
            <span className="badge bg-cream-300 text-charcoal-700">Size: {product.size}</span>
          )}
          {product.is_custom ? (
            <span className="badge bg-charcoal-800 text-white">Made to order</span>
          ) : soldOut ? (
            <span className="badge bg-red-100 text-red-700">Out of stock</span>
          ) : (
            <span className="badge bg-green-100 text-green-700">
              In stock ({product.stock} available)
            </span>
          )}
        </div>

        {product.description && (
          <p className="mt-6 leading-relaxed text-charcoal-500">{product.description}</p>
        )}

        {product.is_custom ? (
          <div className="mt-8 rounded-2xl border border-charcoal-100 bg-cream-100 p-5">
            <p className="font-semibold text-charcoal-800">
              This is a custom, made-to-order piece.
            </p>
            <p className="mt-1 text-sm text-charcoal-500">
              Head to the Custom Art builder to upload your photo and place the order — no account needed.
            </p>
            <a href="/custom-art" className="btn-primary btn-lg mt-4">
              Start your custom art <Zap className="h-4 w-4" />
            </a>
          </div>
        ) : (
          <>
            {/* Quantity */}
            <div className="mt-8 flex items-center gap-4">
              <span className="font-semibold">Quantity</span>
              <div className="flex items-center rounded-full border border-charcoal-200">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 hover:text-terracotta-600"
                  aria-label="Decrease quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold">{qty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  className="p-2.5 hover:text-terracotta-600"
                  aria-label="Increase quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAdd}
                disabled={soldOut}
                className="btn-dark btn-lg flex-1"
              >
                {added ? <Check className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                {added ? "Added!" : "Add to Cart"}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={soldOut}
                className="btn-primary btn-lg flex-1"
              >
                <Zap className="h-5 w-5" /> Buy Now
              </button>
              <button
                onClick={() => toggle(product.id)}
                className="btn-outline btn-lg !px-4"
                aria-label="Toggle wishlist"
              >
                <Heart className={cn("h-5 w-5", wished && "fill-terracotta-500 text-terracotta-500")} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
