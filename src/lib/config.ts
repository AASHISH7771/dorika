// ─────────────────────────────────────────────────────────────
//  Dorika — global site configuration & brand constants
// ─────────────────────────────────────────────────────────────

export const siteConfig = {
  name: "Dorika",
  tagline: "Handmade string art from the heart of Nepal",
  description:
    "Dorika crafts handmade string art in Nepal — including custom String Face Art woven from your photo on a 45cm plank. Delivered across Nepal.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",

  contact: {
    phone: "9708285877",
    phoneDisplay: "+977 9708285877",
    whatsapp: "9779708285877",
    whatsappUrl: "https://wa.me/9779708285877",
    whatsappPrefill:
      "Hi Dorika, I want to know more about your string art.",
    email: "shopdorika@gmail.com",
    address: "Khairenitar, Tanahun, Nepal",
  },

  social: {
    facebook: "https://facebook.com",
    instagram: "https://instagram.com",
    tiktok: "https://tiktok.com",
    youtube: "https://youtube.com",
  },

  currency: {
    code: "NPR",
    symbol: "Rs.",
  },

  // Signature product spec (shown on the Custom Art page)
  customArt: {
    plankSize: "45cm diameter round plank",
    price: 3500,
    makingTime: "7–10 days",
  },

  // Google Maps embed for Khairenitar, Tanahun
  mapEmbed:
    "https://www.google.com/maps?q=Khairenitar,Tanahun,Nepal&output=embed",
} as const;

// Build a WhatsApp deep-link with an optional custom message
export function whatsappLink(message?: string) {
  const text = encodeURIComponent(message ?? siteConfig.contact.whatsappPrefill);
  return `${siteConfig.contact.whatsappUrl}?text=${text}`;
}

// ── Placeholder image config ─────────────────────────────────
// Everything funnels through here so real photos are a one-line swap,
// or override per-product via the admin panel.
export const placeholderConfig = {
  // Deterministic placeholder from a seed string
  product: (seed: string, size = 900) =>
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/${size}/${size}`,
  wide: (seed: string) =>
    `https://picsum.photos/seed/${encodeURIComponent(seed)}/1600/900`,
  // Fallback when a product has no images at all
  fallback: "https://picsum.photos/seed/dorika-fallback/900/900",
};

export function productImage(images: string[] | null | undefined, index = 0) {
  if (images && images.length > index && images[index]) return images[index];
  return placeholderConfig.fallback;
}

// Nav links (shared by navbar + footer)
export const navLinks = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/custom-art", label: "Custom Art" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
  { href: "/track", label: "Track Order" },
] as const;
