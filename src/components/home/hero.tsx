import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";

// Hero photograph: real Dorika piece (round string-art portrait on an easel).
// Swap `public/hero.webp` to change it — no code change needed.
const HERO_IMAGE = "/hero.webp";

export function Hero({ headline, tagline }: { headline: string; tagline: string }) {
  return (
    <section className="relative overflow-hidden bg-cream-100">
      {/* soft background accent */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-terracotta-100/50 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-terracotta-50 blur-3xl" />

      <div className="container-page relative grid items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
        <div className="animate-fade-up">
          <span className="eyebrow inline-flex items-center gap-2">
            <Sparkles className="h-4 w-4" /> From Khairenitar, Tanahun
          </span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
            {headline}
          </h1>
          <p className="mt-5 max-w-lg text-lg text-charcoal-500">{tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/shop" className="btn-primary btn-lg">
              Shop Now <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/custom-art" className="btn-dark btn-lg">
              Create Your Custom Art
            </Link>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-charcoal-500">
            <span className="flex items-center gap-2"><Dot /> 100% handmade</span>
            <span className="flex items-center gap-2"><Dot /> Delivery across Nepal</span>
          </div>
        </div>

        <div className="relative animate-fade-in">
          <div className="relative aspect-square overflow-hidden rounded-[2rem] border-8 border-white shadow-card">
            <Image
              src={HERO_IMAGE}
              alt="Dorika custom string face art on a round wooden plank"
              fill
              priority
              sizes="(max-width:1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="absolute -bottom-5 -left-5 hidden rounded-2xl bg-white p-4 shadow-card sm:block">
            <p className="text-sm font-bold text-charcoal-800">45cm Signature Plank</p>
            <p className="text-xs text-charcoal-400">Made from your photo</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Dot() {
  return <span className="h-2 w-2 rounded-full bg-terracotta-500" />;
}
