"use client";

import Link from "next/link";
import Image from "next/image";
import { X, Plus, Minus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { IMAGES_ENABLED, BLANK_IMAGE } from "@/lib/config";
import { formatNPR } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CartDrawer() {
  const { items, isOpen, setOpen, subtotal, updateQty, removeItem, count } = useCart();

  return (
    <>
      {/* Overlay */}
      <div
        onClick={() => setOpen(false)}
        className={cn(
          "fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-sm transition-opacity",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isOpen}
      />
      {/* Panel */}
      <aside
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-label="Shopping cart"
      >
        <div className="flex items-center justify-between border-b border-charcoal-100 px-5 py-4">
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShoppingBag className="h-5 w-5 text-terracotta-500" />
            Your Cart {count > 0 && <span className="text-charcoal-400">({count})</span>}
          </h2>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close cart"
            className="rounded-full p-2 hover:bg-charcoal-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cream-200">
              <ShoppingBag className="h-9 w-9 text-charcoal-300" />
            </div>
            <p className="text-charcoal-500">Your cart is empty.</p>
            <Link href="/shop" onClick={() => setOpen(false)} className="btn-primary btn-md">
              Start shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <Link
                    href={`/product/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-cream-200"
                  >
                    <Image
                      src={IMAGES_ENABLED ? item.image : BLANK_IMAGE}
                      alt={item.name}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </Link>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-sm font-semibold hover:text-terracotta-600"
                    >
                      {item.name}
                    </Link>
                    {item.size && (
                      <span className="text-xs text-charcoal-400">{item.size}</span>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-1">
                      <div className="flex items-center rounded-full border border-charcoal-200">
                        <button
                          onClick={() => updateQty(item.productId, item.quantity - 1)}
                          className="p-1.5 hover:text-terracotta-600"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQty(item.productId, item.quantity + 1)}
                          className="p-1.5 hover:text-terracotta-600"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="text-sm font-bold text-charcoal-800">
                        {formatNPR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.productId)}
                    aria-label="Remove item"
                    className="self-start p-1 text-charcoal-300 hover:text-red-500"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="border-t border-charcoal-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-charcoal-500">Subtotal</span>
                <span className="text-lg font-bold">{formatNPR(subtotal)}</span>
              </div>
              <p className="mb-4 text-xs text-charcoal-400">
                Delivery calculated at checkout.
              </p>
              <div className="flex flex-col gap-2">
                <Link
                  href="/checkout"
                  onClick={() => setOpen(false)}
                  className="btn-primary btn-lg w-full"
                >
                  Checkout
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setOpen(false)}
                  className="btn-ghost btn-md w-full"
                >
                  View cart
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
