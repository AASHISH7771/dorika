import { Suspense } from "react";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getProducts, getCategories } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { ShopFilters } from "@/components/shop/shop-filters";
import { Pagination } from "@/components/shop/pagination";
import { PackageSearch } from "lucide-react";

export const metadata: Metadata = pageMetadata({
  title: "Shop Handmade String Art",
  description: "Browse handmade string art — wall art, custom face art, home decor and gifts. Delivered across Nepal.",
  // Search/filter/sort variants all canonicalise here, so one clean URL
  // competes for the query instead of several near-duplicates.
  path: "/shop",
  image: "/products/custom-string-face-art.jpg",
});

export const revalidate = 30;

const PER_PAGE = 9;

type SP = { search?: string; category?: string; sort?: string; page?: string };

export default async function ShopPage({ searchParams }: { searchParams: SP }) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const sort = (["newest", "price_asc", "price_desc"].includes(searchParams.sort ?? "")
    ? searchParams.sort
    : "newest") as "newest" | "price_asc" | "price_desc";

  const [{ products, total }, categories] = await Promise.all([
    getProducts({
      search: searchParams.search,
      category: searchParams.category,
      sort,
      page,
      perPage: PER_PAGE,
    }),
    getCategories(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="bg-cream-100">
      {/* Header */}
      <div className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-10 text-center">
          <p className="eyebrow mb-2">Our collection</p>
          <h1 className="text-4xl font-extrabold">Shop String Art</h1>
          <p className="mx-auto mt-2 max-w-xl text-charcoal-400">
            Handcrafted pieces made to order and ready to ship across Nepal.
          </p>
        </div>
      </div>

      <div className="container-page py-10">
        <Suspense fallback={<div className="h-20" />}>
          <ShopFilters categories={categories} />
        </Suspense>

        <p className="mt-6 text-sm text-charcoal-400">
          {total} {total === 1 ? "product" : "products"} found
        </p>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-charcoal-200 bg-white py-20 text-center">
            <PackageSearch className="h-12 w-12 text-charcoal-200" />
            <h2 className="mt-4 text-lg font-bold">No products found</h2>
            <p className="mt-1 text-charcoal-400">Try a different search or category.</p>
          </div>
        ) : (
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        <Pagination page={page} totalPages={totalPages} searchParams={searchParams} />
      </div>
    </div>
  );
}
