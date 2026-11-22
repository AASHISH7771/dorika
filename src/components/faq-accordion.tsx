"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
// Shared with the FAQPage structured data on /faq — single source of truth.
import { faqs } from "@/lib/faq-data";

export function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={i} className="overflow-hidden rounded-2xl border border-charcoal-100 bg-white">
            <button
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-semibold text-charcoal-800"
              aria-expanded={isOpen}
            >
              {f.q}
              <ChevronDown className={cn("h-5 w-5 flex-shrink-0 text-terracotta-500 transition-transform", isOpen && "rotate-180")} />
            </button>
            <div className={cn("grid transition-all duration-300", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
              <div className="overflow-hidden">
                <p className="px-5 pb-5 text-charcoal-500">{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
