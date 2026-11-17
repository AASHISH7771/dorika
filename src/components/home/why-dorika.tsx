import { Hand, Palette, Truck, ShieldCheck, Heart, Clock } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const reasons = [
  { icon: Hand, title: "Truly handmade", desc: "Every nail placed and every thread wound by hand — no machines, no shortcuts." },
  { icon: Palette, title: "Fully custom", desc: "Your photo, your colours, your story. One-of-a-kind by definition." },
  { icon: Truck, title: "Nationwide delivery", desc: "We ship carefully packed art to every district in Nepal." },
  { icon: ShieldCheck, title: "Quality guaranteed", desc: "Premium planks and threads built to last for years." },
  { icon: Heart, title: "Made with love", desc: "A family craft from Khairenitar, Tanahun — made to be treasured." },
  { icon: Clock, title: "On-time crafting", desc: "Clear making times and live order tracking, start to finish." },
];

export function WhyDorika() {
  return (
    <section className="section bg-cream-200">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Dorika"
          title="Crafted to be cherished"
          subtitle="More than décor — a handmade memory you can hang on your wall."
        />
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="flex gap-4 rounded-2xl bg-white p-6 shadow-soft">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
                <r.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-charcoal-800">{r.title}</h3>
                <p className="mt-1 text-sm text-charcoal-500">{r.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
