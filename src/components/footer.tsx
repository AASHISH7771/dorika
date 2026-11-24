import Link from "next/link";
import { MapPin, Phone, Mail, Facebook, Instagram } from "lucide-react";
import { Logo } from "@/components/logo";
import { siteConfig, navLinks, whatsappLink } from "@/lib/config";

// lucide-react (0.447.0) ships no TikTok brand icon, so it lives here as a
// minimal inline SVG matching the same 16px box and stroke-less fill style.
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M16.6 5.82A5.61 5.61 0 0 1 15.28 2h-3.2v13.06a2.81 2.81 0 1 1-2.01-2.69V9.1a6.02 6.02 0 1 0 5.21 5.96V8.99a8.79 8.79 0 0 0 5.12 1.64V7.42a5.6 5.6 0 0 1-3.8-1.6Z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-10 border-t border-charcoal-100 bg-charcoal-800 text-charcoal-200">
      <div className="container-page grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="sm:col-span-2 lg:col-span-1">
          <Logo variant="light" className="h-8" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-300">
            {siteConfig.tagline}. Every piece is hand-woven in Pokhara, Nepal.
          </p>
          <div className="mt-5 flex gap-3">
            <a href={siteConfig.social.facebook} target="_blank" rel="noopener noreferrer"
               aria-label="Facebook"
               className="rounded-full bg-charcoal-700 p-2.5 transition hover:bg-terracotta-500 hover:text-white">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={siteConfig.social.instagram} target="_blank" rel="noopener noreferrer"
               aria-label="Instagram"
               className="rounded-full bg-charcoal-700 p-2.5 transition hover:bg-terracotta-500 hover:text-white">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={siteConfig.social.tiktok} target="_blank" rel="noopener noreferrer"
               aria-label="TikTok"
               className="rounded-full bg-charcoal-700 p-2.5 transition hover:bg-terracotta-500 hover:text-white">
              <TikTokIcon className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Explore</h3>
          <ul className="space-y-2.5 text-sm">
            {navLinks.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="text-charcoal-300 transition hover:text-terracotta-400">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Help</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/faq" className="text-charcoal-300 hover:text-terracotta-400">FAQ</Link></li>
            <li><Link href="/shipping" className="text-charcoal-300 hover:text-terracotta-400">Shipping &amp; Returns</Link></li>
            <li><Link href="/privacy" className="text-charcoal-300 hover:text-terracotta-400">Privacy Policy</Link></li>
            <li><Link href="/terms" className="text-charcoal-300 hover:text-terracotta-400">Terms of Service</Link></li>
            <li><Link href="/track" className="text-charcoal-300 hover:text-terracotta-400">Track Order</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">Get in touch</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-terracotta-400" />
              <span className="text-charcoal-300">{siteConfig.contact.address}</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone className="h-4 w-4 flex-shrink-0 text-terracotta-400" />
              <a href={`tel:+${siteConfig.contact.whatsapp}`} className="text-charcoal-300 hover:text-terracotta-400">
                {siteConfig.contact.phoneDisplay}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4 w-4 flex-shrink-0 text-terracotta-400" />
              <a href={`mailto:${siteConfig.contact.email}`} className="text-charcoal-300 hover:text-terracotta-400">
                {siteConfig.contact.email}
              </a>
            </li>
          </ul>
          <a href={whatsappLink()} target="_blank" rel="noopener noreferrer"
             className="mt-4 inline-flex items-center gap-2 rounded-full bg-whatsapp px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110">
            Chat on WhatsApp
          </a>
        </div>
      </div>

      <div className="border-t border-charcoal-700">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-charcoal-400 sm:flex-row">
          <p>© {year} Dorika. All rights reserved.</p>
          <p>Prices in {siteConfig.currency.code} ({siteConfig.currency.symbol})</p>
        </div>
      </div>
    </footer>
  );
}
