import { Hero } from "@/components/home/hero";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HowItWorks } from "@/components/home/how-it-works";
import { Categories } from "@/components/home/categories";
import { Testimonials } from "@/components/home/testimonials";
import { WhyDorika } from "@/components/home/why-dorika";
import { CtaBanner } from "@/components/home/cta-banner";
import type { Metadata } from "next";
import { getFeaturedProducts, getCategories, getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/config";
import { pageMetadata } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: `${siteConfig.name} — ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
  image: "/products/custom-string-face-art.jpg",
  absoluteTitle: true,
});

export default async function HomePage() {
  const [featured, categories, settings] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
    getSettings(),
  ]);

  return (
    <>
      <Hero
        headline={settings?.hero_headline || siteConfig.tagline}
        tagline={settings?.hero_tagline || siteConfig.description}
      />
      <FeaturedProducts products={featured} />
      <HowItWorks />
      <Categories categories={categories} />
      <Testimonials />
      <WhyDorika />
      <CtaBanner />
    </>
  );
}
