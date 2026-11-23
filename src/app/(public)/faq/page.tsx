import type { Metadata } from "next";
import Link from "next/link";
import { FaqAccordion } from "@/components/faq-accordion";
import { JsonLd } from "@/components/json-ld";
import { faqSchema, pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: "Answers to common questions about ordering, custom String Face Art, payment, delivery and returns.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <div className="bg-cream-100">
      <JsonLd data={faqSchema()} />
      <div className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-10 text-center">
          <p className="eyebrow mb-2">Help centre</p>
          <h1 className="text-4xl font-extrabold">Frequently asked questions</h1>
          <p className="mx-auto mt-2 max-w-lg text-charcoal-400">
            Everything you need to know about ordering from Dorika.
          </p>
        </div>
      </div>
      <div className="container-page py-12">
        <FaqAccordion />
        <p className="mx-auto mt-8 max-w-3xl text-center text-charcoal-500">
          Still have questions?{" "}
          <Link href="/contact" className="font-semibold text-terracotta-600 hover:underline">
            Get in touch
          </Link>{" "}and we&apos;re happy to help.
        </p>
      </div>
    </div>
  );
}
