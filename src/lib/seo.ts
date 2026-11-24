// ─────────────────────────────────────────────────────────────
//  Dorika — SEO helpers
//
//  Everything that turns a page into something Google and social
//  platforms can understand: canonical URLs, Open Graph tags and
//  schema.org structured data.
//
//  Why this file exists: Next.js does NOT emit <link rel="canonical">
//  or override the inherited openGraph object for you. Before this
//  existed, every subpage inherited the root layout's og:url (the
//  homepage) and emitted no canonical at all — so /shop, /cart and
//  /wishlist all looked like duplicates of "/" to a crawler, and any
//  WhatsApp share of a subpage previewed as the homepage.
// ─────────────────────────────────────────────────────────────

import type { Metadata } from "next";
import { siteConfig, hasRealImage } from "@/lib/config";
import type { Product } from "@/lib/types";
import type { StoreInfo } from "@/lib/store-types";
import { faqItems } from "@/lib/faq";

export const SITE_URL = siteConfig.url;

/**
 * Fallback share image. Must be a real file in public/products/ — a 1×1
 * transparent SVG (what `productImage()` returns for photo-less products)
 * renders as a blank grey box on WhatsApp and Facebook.
 */
export const DEFAULT_OG_IMAGE = "/products/custom-string-face-art.jpg";

/** Turn any path into an absolute URL. Leaves absolute URLs untouched. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Resolve a share image. Returns the fallback whenever the candidate is
 * missing, a stock placeholder, or the blank data-URI — all of which would
 * produce a broken preview rather than an image.
 */
export function shareImage(candidate?: string | null): string {
  if (candidate && !candidate.startsWith("data:") && hasRealImage(candidate)) {
    return absoluteUrl(candidate);
  }
  return absoluteUrl(DEFAULT_OG_IMAGE);
}

interface PageMetaArgs {
  /** Page title — the root layout appends " · Dorika". */
  title: string;
  description: string;
  /** Canonical path, e.g. "/shop". Must be the path, not a full URL. */
  path: string;
  /** Optional image path/URL for social previews. */
  image?: string | null;
  /** Keep thin utility pages (/cart, /wishlist) out of the index. */
  noindex?: boolean;
  /**
   * Skip the " · Dorika" template. Only the homepage needs this — its title
   * already contains the brand, so the template would print it twice.
   */
  absoluteTitle?: boolean;
}

/**
 * Build the full metadata object for a page: canonical + robots + Open
 * Graph + Twitter card. Use this instead of a bare `{ title, description }`
 * so that canonicals and share tags never drift apart from the page.
 */
export function pageMetadata({
  title,
  description,
  path,
  image,
  noindex = false,
  absoluteTitle = false,
}: PageMetaArgs): Metadata {
  const url = absoluteUrl(path);
  const ogImage = shareImage(image);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogImage, width: 900, height: 900, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

// ── Structured data (schema.org) ─────────────────────────────
// Emitted as JSON-LD by <JsonLd />. Keep these honest: only publish
// values that appear on the page. Notably there is NO aggregateRating —
// the site publishes no customer reviews yet, and inventing them would be a
// spam-policy violation. Add aggregateRating only when real, verified
// reviews exist and are visible on the page.

const ORG_ID = `${SITE_URL}/#organization`;

/** Splits "Pokhara, Nepal" into schema.org locality + region parts. */
function postalAddress(address: string) {
  const [locality, ...rest] = address.split(",").map((part) => part.trim());
  return {
    "@type": "PostalAddress",
    addressLocality: locality || "Pokhara",
    addressRegion: rest[0] || "Gandaki",
    addressCountry: "NP",
  };
}

/**
 * Brand entity. Tells Google the three social profiles belong to Dorika.
 * `store` comes from the admin Settings row; siteConfig is the fallback so the
 * schema never disagrees with what the page actually shows.
 */
export function organizationSchema(store?: StoreInfo) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: store?.name ?? siteConfig.name,
    url: SITE_URL,
    logo: absoluteUrl("/favicon.svg"),
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    description: siteConfig.description,
    email: store?.email ?? siteConfig.contact.email,
    telephone: `+${store?.whatsapp ?? siteConfig.contact.whatsapp}`,
    sameAs: [
      siteConfig.social.facebook,
      siteConfig.social.instagram,
      siteConfig.social.tiktok,
    ],
    address: postalAddress(store?.address ?? siteConfig.contact.address),
  };
}

/** Site-level entity, needed for brand/entity understanding. */
export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: { "@id": ORG_ID },
    inLanguage: "en",
  };
}

/** Local business card — used on /contact where the address is on page. */
export function localBusinessSchema(store?: StoreInfo) {
  const address = store?.address ?? siteConfig.contact.address;
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: store?.name ?? siteConfig.name,
    url: SITE_URL,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    telephone: `+${store?.whatsapp ?? siteConfig.contact.whatsapp}`,
    email: store?.email ?? siteConfig.contact.email,
    priceRange: "Rs. 1,500 – Rs. 6,000",
    address: {
      ...postalAddress(address),
      streetAddress: address,
    },
    parentOrganization: { "@id": ORG_ID },
  };
}

/**
 * Product + Offer. This is what makes a price and stock state appear in
 * the result instead of a plain blue link.
 */
export function productSchema(product: Product) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const soldOut = product.stock <= 0 && !product.is_custom;

  const images = (product.images ?? [])
    .filter((src) => src && !src.startsWith("data:") && hasRealImage(src))
    .map(absoluteUrl);
  if (images.length === 0) images.push(absoluteUrl(DEFAULT_OG_IMAGE));

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name,
    description: product.description ?? undefined,
    sku: product.slug,
    url,
    image: images,
    category: product.category?.name ?? "Handmade string art",
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: siteConfig.currency.code,
      price: Number(product.price).toFixed(2),
      availability: soldOut
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@id": ORG_ID },
    },
  };
}

/** Home › Shop › Product trail, matching the visible breadcrumb on the page. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** FAQPage — built from the same array the accordion renders. */
export function faqSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
