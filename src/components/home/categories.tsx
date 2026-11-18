import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/lib/types";
import { productImage } from "@/lib/config";
import { SectionHeading } from "@/components/ui/section-heading";

export function Categories({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;
  return (
    <section className="section bg-cream-200">
      <div className="container-page">
        <SectionHeading
          eyebrow="Browse"
          title="Shop by category"
          subtitle="Find the perfect handmade piece for every space and occasion."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/shop?category=${c.slug}`}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-charcoal-800 shadow-soft"
            >
              <Image
                src={productImage(c.image_url ? [c.image_url] : null, 0)}
                alt={c.name}
                fill
                sizes="(max-width:640px) 50vw, 25vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-charcoal-900/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5">
                <h3 className="text-lg font-bold text-white">{c.name}</h3>
                <span className="mt-1 inline-flex items-center gap-1 text-sm text-cream-200 opacity-0 transition group-hover:opacity-100">
                  Shop now <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
