import Link from "next/link";
import { cn } from "@/lib/utils";

export function Pagination({
  page, totalPages, searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;

  const makeHref = (p: number) => {
    const sp = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== "page") sp.set(k, v);
    });
    sp.set("page", String(p));
    return `/shop?${sp.toString()}`;
  };

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  return (
    <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="btn-outline btn-sm">
          Prev
        </Link>
      )}
      {pages.map((p, idx) => {
        const prev = pages[idx - 1];
        const gap = prev && p - prev > 1;
        return (
          <span key={p} className="flex items-center gap-2">
            {gap && <span className="text-charcoal-300">…</span>}
            <Link
              href={makeHref(p)}
              className={cn(
                "flex h-9 min-w-9 items-center justify-center rounded-full px-3 text-sm font-semibold transition",
                p === page
                  ? "bg-terracotta-500 text-white"
                  : "border border-charcoal-200 bg-white text-charcoal-600 hover:border-terracotta-300"
              )}
            >
              {p}
            </Link>
          </span>
        );
      })}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className="btn-outline btn-sm">
          Next
        </Link>
      )}
    </nav>
  );
}
