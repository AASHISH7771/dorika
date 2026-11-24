"use client";

import { createContext, useContext } from "react";
import { FALLBACK_STORE, type StoreInfo } from "@/lib/store-types";

const StoreContext = createContext<StoreInfo | null>(null);

/**
 * Hands the resolved store identity to client components (navbar, WhatsApp
 * button, custom art builder) so they do not have to reach for build-time
 * config and drift out of date when the owner edits Settings.
 */
export function StoreProvider({
  value,
  children,
}: {
  value: StoreInfo;
  children: React.ReactNode;
}) {
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

/**
 * Falls back to build-time config instead of throwing: the root 404 page
 * renders Navbar and Footer outside <StoreProvider>, and a thrown error there
 * would turn a missing page into a server error.
 */
export function useStore(): StoreInfo {
  return useContext(StoreContext) ?? FALLBACK_STORE;
}
