import type { Metadata } from "next";
import { localBusinessSchema, pageMetadata } from "@/lib/seo";
import { JsonLd } from "@/components/json-ld";
import { Phone, Mail, MapPin, MessageCircle, Clock } from "lucide-react";
import { ContactForm } from "@/components/contact/contact-form";
import { siteConfig, whatsappLink } from "@/lib/config";

export const metadata: Metadata = pageMetadata({
  title: "Contact Us",
  description: "Get in touch with Dorika. Call, WhatsApp, email, or visit us in Khairenitar, Tanahun, Nepal.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <div className="bg-cream-100">
      <JsonLd data={localBusinessSchema()} />
      <div className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-10 text-center">
          <p className="eyebrow mb-2">We&apos;d love to hear from you</p>
          <h1 className="text-4xl font-extrabold">Contact Dorika</h1>
          <p className="mx-auto mt-2 max-w-lg text-charcoal-400">
            Questions about a custom piece, an order, or anything else? Reach out.
          </p>
        </div>
      </div>

      <div className="container-page py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Info */}
          <div className="space-y-4">
            <InfoCard icon={Phone} title="Call us" value={siteConfig.contact.phoneDisplay} href={`tel:+${siteConfig.contact.whatsapp}`} />
            <InfoCard icon={MessageCircle} title="WhatsApp" value="Chat with us instantly" href={whatsappLink()} external />
            <InfoCard icon={Mail} title="Email" value={siteConfig.contact.email} href={`mailto:${siteConfig.contact.email}`} />
            <InfoCard icon={MapPin} title="Visit" value={siteConfig.contact.address} />
            <div className="flex items-start gap-3 rounded-2xl border border-charcoal-100 bg-white p-5">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
                <Clock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-charcoal-800">Opening hours</p>
                <p className="text-sm text-charcoal-500">Sun–Fri · 9:00 AM – 6:00 PM</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div>
            <ContactForm />
          </div>
        </div>

        {/* Map */}
        <div className="mt-10 overflow-hidden rounded-2xl border border-charcoal-100 shadow-soft">
          <iframe
            title="Dorika location: Khairenitar, Tanahun"
            src={siteConfig.mapEmbed}
            width="100%"
            height="400"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon: Icon, title, value, href, external,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <p className="font-bold text-charcoal-800">{title}</p>
        <p className="text-sm text-charcoal-500">{value}</p>
      </div>
    </>
  );
  const cls = "flex items-start gap-3 rounded-2xl border border-charcoal-100 bg-white p-5 transition hover:border-terracotta-300";
  if (href) {
    return (
      <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}
