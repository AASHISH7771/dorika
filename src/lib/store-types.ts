// ─────────────────────────────────────────────────────────────
//  Store identity — shape and pure helpers.
//
//  Lives apart from `store-info.ts` because that module is server-only:
//  client components (navbar, WhatsApp button) need these values too, and
//  they receive them through <StoreProvider> rather than by querying.
//
//  Why this exists at all: the storefront used to read its phone, email,
//  address and shop name from `siteConfig` at build time, while the admin
//  Settings page wrote them to the `settings` table. Editing them looked
//  like it worked and changed nothing. Now one resolver reads the database
//  with the config as fallback, and every surface uses the result.
// ─────────────────────────────────────────────────────────────

import { siteConfig } from "@/lib/config";

export interface StoreInfo {
  /** Shop name, e.g. "Dorika". */
  name: string;
  email: string;
  /** Human-facing phone, e.g. "+977 9708285877". */
  phoneDisplay: string;
  /** Digits only, for tel: links. */
  phoneDial: string;
  /** Digits with country code, for wa.me links. */
  whatsapp: string;
  address: string;
  /** Default WhatsApp opener. */
  prefilledMessage: string;
}

/** Strip everything that is not a digit. */
export function digits(value: string): string {
  return value.replace(/[^\d]/g, "");
}

/**
 * wa.me wants the full international number with no punctuation. Nepali
 * numbers are stored locally as 97xxxxxxxx (10 digits), so a bare local
 * number gets the 977 country code rather than producing a dead link.
 */
export function normaliseWhatsapp(raw: string | null | undefined): string {
  const d = digits(raw ?? "");
  if (!d) return "";
  if (d.startsWith("977")) return d;
  if (d.length === 10) return `977${d}`;
  return d;
}

export function formatPhoneDisplay(raw: string | null | undefined): string {
  const d = normaliseWhatsapp(raw);
  if (!d) return "";
  if (d.startsWith("977") && d.length === 13) return `+977 ${d.slice(3)}`;
  return `+${d}`;
}

/** WhatsApp deep link with an optional message. */
export function waHref(store: StoreInfo, message?: string): string {
  const text = encodeURIComponent(message ?? store.prefilledMessage);
  return `https://wa.me/${store.whatsapp}?text=${text}`;
}

/**
 * Build-time fallback, used only where the provider is genuinely absent (the
 * root 404 page renders Navbar and Footer outside the public layout). Keeping
 * this non-throwing means a future page cannot 500 just because it renders the
 * header in the wrong place.
 */
export const FALLBACK_STORE: StoreInfo = {
  name: siteConfig.name,
  email: siteConfig.contact.email,
  phoneDisplay: siteConfig.contact.phoneDisplay,
  phoneDial: digits(siteConfig.contact.whatsapp),
  whatsapp: normaliseWhatsapp(siteConfig.contact.whatsapp),
  address: siteConfig.contact.address,
  prefilledMessage: siteConfig.contact.whatsappPrefill,
};