import type { MetadataRoute } from "next";
import { getProductsForSitemap } from "@/lib/queries";
import { siteConfig } from "@/lib/config";

/**
 * Date the static pages last actually changed content.
 *
 * Bump this by hand when you edit copy on /about, /faq, /shipping etc.
 * It must NOT be `new Date()` — that stamped every URL with the build time on
 * every deploy, which teaches Google to distrust `lastmod` site-wide.
 */
const STATIC_PAGES_UPDATED = new Date("2026-11-22T00:00:00Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteConfig.url;

  const staticRoutes = [
    { path: "", priority: 1 },
    { path: "/shop", priority: 0.9 },
    { path: "/custom-art", priority: 0.9 },
    { path: "/about", priority: 0.7 },
    { path: "/contact", priority: 0.7 },
    { path: "/track", priority: 0.5 },
    { path: "/faq", priority: 0.7 },
    { path: "/shipping", priority: 0.5 },
    { path: "/privacy", priority: 0.3 },
    { path: "/terms", priority: 0.3 },
  ].map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: STATIC_PAGES_UPDATED,
    changeFrequency: "weekly" as const,
    priority,
  }));

  // Only products that are actually live. Photo-less products are deactivated
  // in the admin, so they drop out of the sitemap automatically instead of
  // being advertised to Google as thin, image-less pages.
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const products = await getProductsForSitemap();
    productRoutes = products.map((p) => ({
      url: `${base}/product/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : STATIC_PAGES_UPDATED,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    /* ignore before DB is configured */
  }

  return [...staticRoutes, ...productRoutes];
}
