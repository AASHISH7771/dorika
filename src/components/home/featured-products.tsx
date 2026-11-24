import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/ui/section-heading";

export function FeaturedProducts({ products }: { products: Product[] }) {
  if (!products.length) return null;
  return (
    <section className="section bg-cream-100">
      <div className="container-page">
        <SectionHeading
          eyebrow="Best sellers"
          title="Featured pieces"
          subtitle="Our most-loved handmade string art, ready to ship."
        />
        {/* Flex + justify-center rather than a 4-column grid: with only three
            pieces a grid pins them to the left and leaves a hole on the right.
            Widths reproduce the same 1 / 2 / 4 column rhythm with gap-5. */}
        <div className="flex flex-wrap justify-center gap-5">
          {products.slice(0, 8).map((p) => (
            <div
              key={p.id}
              className="w-full sm:w-[calc(50%_-_0.625rem)] lg:w-[calc(25%_-_0.9375rem)]"
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link href="/shop" className="btn-outline btn-lg">
            View all products <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
