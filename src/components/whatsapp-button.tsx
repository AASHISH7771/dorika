"use client";

import { useStore } from "@/components/store-context";
import { waHref } from "@/lib/store-types";

/**
 * Floating WhatsApp button — fixed bottom-right on every page.
 * Green circle (~60px), white WA glyph, soft glow, red notification dot,
 * subtle pulse. Opens a prefilled WhatsApp chat.
 */
export function WhatsAppButton() {
  const store = useStore();
  return (
    <a
      href={waHref(store)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Dorika on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex h-[60px] w-[60px] items-center
                 justify-center rounded-full bg-whatsapp text-white shadow-float
                 animate-wa-pulse transition-transform duration-200 hover:scale-110
                 focus-visible:ring-4 focus-visible:ring-whatsapp/40 sm:bottom-6 sm:right-6"
    >
      {/* red notification dot */}
      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-red-500" />
      <svg viewBox="0 0 32 32" className="h-8 w-8 fill-white" aria-hidden="true">
        <path d="M16.004 0h-.008C7.17 0 .004 7.168.004 16c0 3.504 1.13 6.75 3.05 9.39L1.05 31.2l5.98-1.912A15.9 15.9 0 0 0 16.004 32C24.84 32 32 24.832 32 16S24.84 0 16.004 0z" opacity="0" />
        <path d="M16 3C8.82 3 3 8.82 3 16c0 2.3.6 4.46 1.66 6.33L3 29l6.84-1.8A12.9 12.9 0 0 0 16 29c7.18 0 13-5.82 13-13S23.18 3 16 3zm7.62 18.38c-.32.9-1.6 1.66-2.62 1.88-.7.15-1.6.27-4.65-1-3.9-1.62-6.4-5.58-6.6-5.84-.19-.26-1.57-2.1-1.57-4s1-2.84 1.35-3.23c.29-.32.76-.47 1.2-.47.15 0 .28 0 .4.01.35.02.53.04.76.6.29.7 1 2.43 1.08 2.6.09.18.15.39.03.63-.11.24-.17.39-.34.6-.17.2-.36.45-.51.6-.17.17-.35.36-.15.7.2.35.9 1.48 1.93 2.4 1.32 1.18 2.44 1.54 2.79 1.69.35.15.56.12.76-.07.2-.2.88-1.02 1.11-1.37.23-.35.47-.29.79-.17.32.11 2.04.96 2.39 1.14.35.17.58.26.66.4.09.15.09.83-.23 1.73z" />
      </svg>
    </a>
  );
}
