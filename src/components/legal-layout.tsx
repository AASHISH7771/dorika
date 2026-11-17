export function LegalLayout({
  title, updated, children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-cream-100">
      <div className="border-b border-charcoal-100 bg-white">
        <div className="container-page py-10">
          <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
          {updated && <p className="mt-2 text-sm text-charcoal-400">Last updated: {updated}</p>}
        </div>
      </div>
      <div className="container-page py-10">
        <div className="prose-dorika mx-auto max-w-3xl space-y-6 rounded-2xl border border-charcoal-100 bg-white p-6 sm:p-10">
          {children}
        </div>
      </div>
    </div>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-charcoal-800">{heading}</h2>
      <div className="mt-2 space-y-2 leading-relaxed text-charcoal-500">{children}</div>
    </section>
  );
}
