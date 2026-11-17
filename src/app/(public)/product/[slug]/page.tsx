import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts, getAllProductSlugs } from "@/lib/queries";
import { ProductDetailClient } from "@/components/product/product-detail-client";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { productImage } from "@/lib/config";

export const revalidate = 30;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: {
      title: product.name,
      description: product.description ?? undefined,
      images: [{ url: productImage(product.images, 0) }],
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const related = await getRelatedProducts(product.category_id, product.id, 4);

  return (
    <div className="bg-white">
      <div className="container-page py-6">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm text-charcoal-400" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-terracotta-600">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/shop" className="hover:text-terracotta-600">Shop</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="truncate text-charcoal-600">{product.name}</span>
        </nav>

        <ProductDetailClient product={product} />
      </div>

      {related.length > 0 && (
        <section className="section bg-cream-100">
          <div className="container-page">
            <SectionHeading eyebrow="You may also like" title="Related products" />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
