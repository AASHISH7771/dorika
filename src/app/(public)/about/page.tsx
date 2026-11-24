import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Heart, Target, Sparkles, Hand, Leaf, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { getStoreInfo } from "@/lib/store-info";

export const metadata: Metadata = pageMetadata({
  title: "About Us",
  description: "The story of Dorika, a family string-art workshop in Pokhara, Nepal.",
  path: "/about",
});

const values = [
  { icon: Hand, title: "Handmade, always", desc: "No machines. Every piece is wound by hand, nail by nail." },
  { icon: Heart, title: "Made with care", desc: "We treat every photo and every order as if it were our own." },
  { icon: Leaf, title: "Quality materials", desc: "Durable planks and premium threads that stand the test of time." },
  { icon: Users, title: "Local & proud", desc: "A family craft creating livelihoods in Pokhara." },
];

const steps = [
  { title: "Design", desc: "We translate your photo into a precise nail-and-thread pattern." },
  { title: "Frame", desc: "We prepare and finish the 45cm round wooden plank." },
  { title: "Nail", desc: "Hundreds of nails are hammered in by hand along the pattern." },
  { title: "Weave", desc: "Thread is wound back and forth until your portrait emerges." },
];

export default async function AboutPage() {
  const store = await getStoreInfo();
  return (
    <div className="bg-cream-100">
      {/* Hero */}
      <section className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-14">
          <div className="max-w-3xl">
            <p className="eyebrow mb-2">Our story</p>
            <h1 className="text-4xl font-extrabold sm:text-5xl">
              Made by hand,<br />in Pokhara, Nepal
            </h1>
            <p className="mt-5 text-charcoal-500">
              {store.name} began in {store.address} with a simple idea: that a length of
              thread and a handful of nails could hold a memory. What started as a hobby grew
              into a small family workshop making handmade string art, plus our signature
              String Face Art, woven from your own photos.
            </p>
            <div className="mt-7 flex gap-3">
              <Link href="/custom-art" className="btn-primary btn-lg">Create your art</Link>
              <Link href="/shop" className="btn-outline btn-lg">Browse shop</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="section">
        <div className="container-page grid gap-6 md:grid-cols-3">
          <MissionCard icon={Target} title="Our mission" text="To turn everyday photos and spaces into handcrafted keepsakes that last a lifetime." />
          <MissionCard icon={Sparkles} title="Our craft" text="Precision patterns, careful nailing, and patient weaving. The art is in the detail." />
          <MissionCard icon={Heart} title="Our promise" text="Genuine handmade quality, honest pricing, and delivery to your door across Nepal." />
        </div>
      </section>

      {/* Process */}
      <section className="section bg-white">
        <div className="container-page">
          <SectionHeading eyebrow="The craft process" title="How a piece comes to life" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl border border-charcoal-100 bg-cream-100 p-6">
                <span className="text-sm font-bold text-terracotta-500">Step {i + 1}</span>
                <h3 className="mt-1 text-lg font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-charcoal-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Maker */}
      <section className="section">
        <div className="container-page rounded-[2rem] bg-charcoal-800 p-8 text-white sm:p-12">
          <div className="max-w-3xl">
            <p className="eyebrow mb-2 !text-terracotta-400">Meet the maker</p>
            <h2 className="text-3xl font-extrabold text-white">One maker, one piece at a time</h2>
            <p className="mt-4 text-charcoal-200">
              Behind every Dorika piece is a maker who cares about getting the little things
              right: the tension of the thread, the finish of the plank, the likeness in a
              portrait. We&apos;re a small team, and that&apos;s exactly why each order gets
              our full attention.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section bg-white">
        <div className="container-page">
          <SectionHeading eyebrow="What we stand for" title="Our values" />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-charcoal-100 bg-cream-100 p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-50 text-terracotta-600">
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold">{v.title}</h3>
                <p className="mt-1 text-sm text-charcoal-500">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function MissionCard({
  icon: Icon, title, text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-charcoal-100 bg-white p-7 shadow-soft">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-terracotta-500 text-white">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="mt-2 text-charcoal-500">{text}</p>
    </div>
  );
}
