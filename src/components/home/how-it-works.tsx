import { Upload, PenTool, Hammer, Truck } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const steps = [
  { icon: Upload, title: "Upload your photo", desc: "Send us a clear face photo — straight from your phone or gallery." },
  { icon: PenTool, title: "We design the pattern", desc: "Our artists map your photo into a precise thread pattern." },
  { icon: Hammer, title: "We hand-craft it", desc: "Each nail is placed and wound by hand on a 45cm round plank." },
  { icon: Truck, title: "Delivered to your door", desc: "Carefully packed and shipped anywhere in Nepal." },
];

export function HowItWorks() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="String Face Art"
          title="How it works"
          subtitle="From a single photo to a handcrafted keepsake — in four simple steps."
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-charcoal-100 bg-cream-100 p-6 transition hover:shadow-card">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-500 text-white">
                <s.icon className="h-6 w-6" />
              </div>
              <span className="absolute right-5 top-5 text-4xl font-extrabold text-charcoal-100">
                {i + 1}
              </span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-charcoal-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
