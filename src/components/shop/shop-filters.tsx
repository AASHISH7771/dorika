"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ShopFilters({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [search, setSearch] = useState(params.get("search") ?? "");
  const activeCat = params.get("category") ?? "";
  const activeSort = params.get("sort") ?? "newest";

  // Keep local input in sync when navigating
  useEffect(() => setSearch(params.get("search") ?? ""), [params]);

  const push = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(updates).forEach(([k, v]) => {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      });
      next.delete("page"); // reset pagination on any filter change
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          push({ search: search.trim() || null });
        }}
        className="relative"
      >
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="input pl-10 pr-10"
          aria-label="Search products"
        />
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(""); push({ search: null }); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 hover:text-charcoal-600"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {/* Sort (mobile-friendly) + categories */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <CatChip label="All" active={!activeCat} onClick={() => push({ category: null })} />
          {categories.map((c) => (
            <CatChip
              key={c.id}
              label={c.name}
              active={activeCat === c.slug}
              onClick={() => push({ category: c.slug })}
            />
          ))}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <span className="text-charcoal-400">Sort</span>
          <select
            value={activeSort}
            onChange={(e) => push({ sort: e.target.value })}
            className="input !w-auto !py-2 !pr-8 text-sm"
            aria-label="Sort products"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low → High</option>
            <option value="price_desc">Price: High → Low</option>
          </select>
        </label>
      </div>
    </div>
  );
}

function CatChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-full border px-4 py-1.5 text-sm font-semibold transition",
        active
          ? "border-terracotta-500 bg-terracotta-500 text-white"
          : "border-charcoal-200 bg-white text-charcoal-600 hover:border-terracotta-300 hover:text-terracotta-600"
      )}
    >
      {label}
    </button>
  );
}
