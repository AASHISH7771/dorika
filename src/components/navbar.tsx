"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, ShoppingBag, Heart, User, Search } from "lucide-react";
import { Logo } from "@/components/logo";
import { navLinks } from "@/lib/config";
import { useCart } from "@/lib/cart-context";
import { useWishlist } from "@/lib/wishlist-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { count, setOpen } = useCart();
  const { count: wishCount } = useWishlist();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  // Don't render the public navbar inside admin
  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-all duration-300",
        scrolled
          ? "border-charcoal-100 bg-white/90 backdrop-blur-md shadow-soft"
          : "border-transparent bg-cream-100"
      )}
    >
      <nav className="container-page flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo className="h-8 lg:h-9" />

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    active
                      ? "bg-terracotta-50 text-terracotta-600"
                      : "text-charcoal-600 hover:bg-charcoal-50 hover:text-charcoal-800"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/shop"
            aria-label="Search products"
            className="hidden rounded-full p-2.5 text-charcoal-600 hover:bg-charcoal-50 sm:block"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href="/wishlist"
            aria-label="Wishlist"
            className="relative hidden rounded-full p-2.5 text-charcoal-600 hover:bg-charcoal-50 sm:block"
          >
            <Heart className="h-5 w-5" />
            {wishCount > 0 && (
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-terracotta-500" />
            )}
          </Link>
          <button
            onClick={() => setOpen(true)}
            aria-label="Open cart"
            className="relative rounded-full p-2.5 text-charcoal-700 hover:bg-charcoal-50"
          >
            <ShoppingBag className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1 text-[11px] font-bold text-white">
                {count}
              </span>
            )}
          </button>
          <Link
            href="/account"
            aria-label="Account"
            className="hidden rounded-full p-2.5 text-charcoal-600 hover:bg-charcoal-50 sm:block"
          >
            <User className="h-5 w-5" />
          </Link>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
            className="rounded-full p-2.5 text-charcoal-700 hover:bg-charcoal-50 lg:hidden"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-t border-charcoal-100 bg-white transition-[max-height] duration-300 lg:hidden",
          mobileOpen ? "max-h-[520px]" : "max-h-0 border-t-0"
        )}
      >
        <ul className="container-page flex flex-col py-3">
          {navLinks.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname?.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "block rounded-xl px-4 py-3 text-base font-semibold",
                    active
                      ? "bg-terracotta-50 text-terracotta-600"
                      : "text-charcoal-700 hover:bg-charcoal-50"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
          <li className="mt-1 flex gap-2 px-4 pb-2 pt-3">
            <Link href="/account" className="btn-outline btn-sm flex-1">
              <User className="h-4 w-4" /> Account
            </Link>
            <Link href="/wishlist" className="btn-outline btn-sm flex-1">
              <Heart className="h-4 w-4" /> Wishlist
            </Link>
          </li>
        </ul>
      </div>
    </header>
  );
}
