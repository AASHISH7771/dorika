"use client";

import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { IMAGES_ENABLED, BLANK_IMAGE } from "@/lib/config";
import { formatNPR } from "@/lib/utils";

export default function CartPage() {
  const { items, subtotal, updateQty, removeItem, count } = useCart();

  return (
    <div className="bg-cream-100">
      <div className="container-page py-10">
        <h1 className="text-3xl font-extrabold">Your Cart</h1>
        <p className="mt-1 text-charcoal-400">
          {count > 0 ? `${count} item${count > 1 ? "s" : ""} in your cart` : "Your cart is empty"}
        </p>

        {items.length === 0 ? (
          <div className="mt-10 flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal-200 bg-white py-20 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-200">
              <ShoppingBag className="h-9 w-9 text-charcoal-300" />
            </div>
            <p className="mt-4 text-charcoal-500">You haven&apos;t added anything yet.</p>
            <Link href="/shop" className="btn-primary btn-lg mt-6">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
            {/* Items */}
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-4 rounded-2xl border border-charcoal-100 bg-white p-4">
                  <Link href={`/product/${item.slug}`} className="relative h-24 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-cream-200">
                    <Image src={IMAGES_ENABLED ? item.image : BLANK_IMAGE} alt={item.name} fill sizes="96px" className="object-cover" />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link href={`/product/${item.slug}`} className="font-semibold hover:text-terracotta-600">
                      {item.name}
                    </Link>
                    {item.size && <span className="text-sm text-charcoal-400">{item.size}</span>}
                    <span className="text-sm font-semibold text-terracotta-600">{formatNPR(item.price)}</span>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-full border border-charcoal-200">
                        <button onClick={() => updateQty(item.productId, item.quantity - 1)} className="p-2 hover:text-terracotta-600" aria-label="Decrease">
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                        <button onClick={() => updateQty(item.productId, item.quantity + 1)} className="p-2 hover:text-terracotta-600" aria-label="Increase">
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(item.productId)} className="flex items-center gap-1 text-sm text-charcoal-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" /> Remove
                      </button>
                    </div>
                  </div>
                  <div className="hidden font-bold text-charcoal-800 sm:block">
                    {formatNPR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <aside className="h-fit rounded-2xl border border-charcoal-100 bg-white p-6 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold">Order summary</h2>
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Subtotal</span>
                  <span className="font-semibold">{formatNPR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-500">Delivery</span>
                  <span className="text-charcoal-400">Calculated at checkout</span>
                </div>
              </div>
              <div className="mt-4 flex justify-between border-t border-charcoal-100 pt-4 text-lg">
                <span className="font-bold">Total</span>
                <span className="font-extrabold">{formatNPR(subtotal)}</span>
              </div>
              <Link href="/checkout" className="btn-primary btn-lg mt-6 w-full">
                Proceed to checkout <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/shop" className="btn-ghost btn-md mt-2 w-full">
                Continue shopping
              </Link>
              <p className="mt-4 text-center text-xs text-charcoal-400">
                No account needed — checkout as a guest.
              </p>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
