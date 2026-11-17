import type { MetadataRoute } from "next";
import { getAllProductSlugs } from "@/lib/queries";
import { siteConfig } from "@/lib/config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;
  const staticRoutes = [
    "", "/shop", "/custom-art", "/about", "/contact", "/track",
    "/faq", "/shipping", "/privacy", "/terms",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));

  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const slugs = await getAllProductSlugs();
    productRoutes = slugs.map((slug) => ({
      url: `${base}/product/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));
  } catch {
    /* ignore before DB is configured */
  }

  return [...staticRoutes, ...productRoutes];
}
