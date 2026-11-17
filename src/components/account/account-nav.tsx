"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Palette,
  MapPin,
  User,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: ShoppingBag },
  { href: "/account/custom-requests", label: "Custom Art", icon: Palette },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
] as const;

export function AccountNav({
  name,
  email,
  signOut,
}: {
  name: string | null;
  email: string;
  signOut: () => void;
}) {
  const pathname = usePathname();
  const initial = (name || email || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="lg:sticky lg:top-24">
      <div className="card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-charcoal-100 p-4">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-terracotta-100 text-sm font-extrabold text-terracotta-700">
            {initial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-charcoal-800">{name || "Dorika customer"}</p>
            <p className="truncate text-xs text-charcoal-400" title={email}>
              {email}
            </p>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto p-2 no-scrollbar lg:flex-col">
          {NAV.map((item) => {
            const active =
              item.href === "/account" ? pathname === "/account" : pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-terracotta-500 text-white"
                    : "text-charcoal-600 hover:bg-cream-200 hover:text-charcoal-800"
                )}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <form action={signOut} className="border-t border-charcoal-100 p-2">
          <button
            type="submit"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-charcoal-500 transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px]" /> Sign out
          </button>
        </form>
      </div>

      <Link
        href="/shop"
        className="mt-3 hidden items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal-200 px-3 py-2.5 text-sm font-semibold text-charcoal-500 hover:border-terracotta-300 hover:text-terracotta-600 lg:flex"
      >
        Continue shopping
      </Link>
    </div>
  );
}
