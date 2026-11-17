import Link from "next/link";
import { ArrowRight, Phone, Mail, MapPin } from "lucide-react";
import { siteConfig, whatsappLink } from "@/lib/config";

export function CtaBanner() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <div className="relative overflow-hidden rounded-[2rem] bg-charcoal-800 px-6 py-14 text-center sm:px-12 lg:py-20">
          <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-terracotta-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-20 h-80 w-80 rounded-full bg-terracotta-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Turn your favourite photo into string art
            </h2>
            <p className="mt-4 text-lg text-charcoal-200">
              Upload a face photo and we&apos;ll hand-craft it on a 45cm plank — no account needed.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/custom-art" className="btn-primary btn-lg">
                Create Your Custom Art <ArrowRight className="h-4 w-4" />
              </Link>
              <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="btn-outline btn-lg !border-white/30 !bg-transparent !text-white hover:!border-white">
                Ask on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Contact strip */}
        <div className="mt-6 grid gap-4 rounded-2xl border border-charcoal-100 bg-cream-100 p-6 sm:grid-cols-3">
          <a href={`tel:+${siteConfig.contact.whatsapp}`} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
              <Phone className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs text-charcoal-400">Call / WhatsApp</span>
              <span className="font-semibold text-charcoal-800">{siteConfig.contact.phoneDisplay}</span>
            </span>
          </a>
          <a href={`mailto:${siteConfig.contact.email}`} className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
              <Mail className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs text-charcoal-400">Email us</span>
              <span className="font-semibold text-charcoal-800">{siteConfig.contact.email}</span>
            </span>
          </a>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
              <MapPin className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-xs text-charcoal-400">Visit us</span>
              <span className="font-semibold text-charcoal-800">{siteConfig.contact.address}</span>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
