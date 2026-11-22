import { Star, Quote } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";

const testimonials = [
  {
    name: "Anita Gurung",
    location: "Pokhara",
    text: "I sent a photo of my late father and Dorika turned it into the most beautiful string art. My mother cried happy tears. Worth every rupee.",
  },
  {
    name: "Bikash Shrestha",
    location: "Kathmandu",
    text: "Ordered a couple portrait for our anniversary. The detail on the 45cm plank is incredible. Delivery to KTM was quick too.",
  },
  {
    name: "Sushmita Thapa",
    location: "Chitwan",
    text: "The mandala piece is even better in person. You can feel it's genuinely handmade. Already planning my next order.",
  },
];

export function Testimonials() {
  return (
    <section className="section bg-white">
      <div className="container-page">
        <SectionHeading
          eyebrow="Loved by customers"
          title="What people are saying"
        />
        <div className="grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure key={t.name} className="relative rounded-2xl border border-charcoal-100 bg-cream-100 p-7 shadow-soft">
              <Quote className="absolute right-6 top-6 h-8 w-8 text-terracotta-100" />
              <div className="mb-3 flex gap-0.5 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <blockquote className="text-charcoal-600">&ldquo;{t.text}&rdquo;</blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-terracotta-500 font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-charcoal-800">{t.name}</p>
                  <p className="text-sm text-charcoal-400">{t.location}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
