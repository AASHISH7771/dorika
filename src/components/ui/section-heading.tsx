import { cn } from "@/lib/utils";

export function SectionHeading({
  eyebrow, title, subtitle, align = "center", className,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-10 max-w-2xl",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
    >
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-3 text-charcoal-400">{subtitle}</p>}
    </div>
  );
}
