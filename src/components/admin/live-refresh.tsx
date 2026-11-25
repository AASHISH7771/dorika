"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Re-runs the server component on a timer so an open conversation picks up
 * new customer messages without anyone pressing refresh. Deliberately simple:
 * an 8s poll of one page, no websockets, nothing to keep alive on a free-tier
 * host.
 */
export function LiveRefresh({ ms = 8000 }: { ms?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, ms);
    return () => clearInterval(id);
  }, [ms, router]);

  return null;
}
