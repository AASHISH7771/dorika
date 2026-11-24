import "server-only";
import { cache } from "react";
import { getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/config";
import {
  formatPhoneDisplay,
  normaliseWhatsapp,
  type StoreInfo,
} from "@/lib/store-types";


/**
 * Resolve the shop's own identity, database first and `siteConfig` second.
 *
 * Wrapped in React's `cache` so a single render costs one settings read even
 * though the layout, footer and page all ask for it.
 */
export const getStoreInfo = cache(async (): Promise<StoreInfo> => {
  const s = await getSettings();

  const whatsapp =
    normaliseWhatsapp(s?.whatsapp) ||
    normaliseWhatsapp(s?.store_phone) ||
    siteConfig.contact.whatsapp;

  return {
    name: s?.store_name?.trim() || siteConfig.name,
    email: s?.store_email?.trim() || siteConfig.contact.email,
    phoneDisplay:
      formatPhoneDisplay(s?.store_phone || s?.whatsapp) ||
      siteConfig.contact.phoneDisplay,
    phoneDial: normaliseWhatsapp(s?.store_phone || s?.whatsapp) || whatsapp,
    whatsapp,
    address: s?.address?.trim() || siteConfig.contact.address,
    prefilledMessage: siteConfig.contact.whatsappPrefill,
  };
});
