import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Ruler, Clock, BadgeCheck } from "lucide-react";
import { CustomArtBuilder } from "@/components/custom-art/custom-art-builder";
import { getSettings } from "@/lib/queries";
import { siteConfig } from "@/lib/config";
import { formatNPR } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: "Custom String Face Art",
  description:
    "Upload a face photo and we'll hand-craft it into string art on a 45cm round plank. No account needed. Delivered across Nepal.",
  path: "/custom-art",
  image: "/products/custom-string-face-art.jpg",
});

export default async function CustomArtPage() {
  const settings = await getSettings();
  const price = Number(settings?.custom_art_price ?? siteConfig.customArt.price);
  const makingTime = settings?.custom_art_days ?? siteConfig.customArt.makingTime;

  return (
    <div className="bg-cream-100">
      {/* Intro */}
      <section className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-12 text-center">
          <p className="eyebrow mb-2">Our signature service</p>
          <h1 className="text-4xl font-extrabold sm:text-5xl">String Face Art</h1>
          <p className="mx-auto mt-3 max-w-2xl text-charcoal-500">
            Send us a face photo and we&apos;ll turn it into a one-of-a-kind, hand-woven
            string art portrait on a 45cm round wooden plank. No account required.
          </p>

          <div className="mx-auto mt-8 grid max-w-2xl gap-4 sm:grid-cols-3">
            <Spec icon={Ruler} label="Size" value="45cm round plank" />
            <Spec icon={BadgeCheck} label="Price" value={formatNPR(price)} />
            <Spec icon={Clock} label="Making time" value={makingTime} />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <CustomArtBuilder price={price} makingTime={makingTime} />
        </div>
      </section>
    </div>
  );
}

function Spec({
  icon: Icon, label, value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-charcoal-100 bg-cream-100 p-4 text-left">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block text-xs text-charcoal-400">{label}</span>
        <span className="font-bold text-charcoal-800">{value}</span>
      </span>
    </div>
  );
}
