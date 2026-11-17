import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Dorika wordmark logo, rebuilt from the brand SVG.
 * - charcoal wordmark (#24272B)
 * - terracotta "thread" sweep with knot details (#C55A29)
 * `variant="light"` renders the wordmark in white for dark backgrounds.
 */
export function Logo({
  className,
  variant = "dark",
  withLink = true,
}: {
  className?: string;
  variant?: "dark" | "light";
  withLink?: boolean;
}) {
  const fill = variant === "light" ? "#FFFFFF" : "#24272B";

  const svg = (
    <svg
      viewBox="0 0 1200 260"
      className={cn("h-9 w-auto", className)}
      role="img"
      aria-label="Dorika"
    >
      <text
        x="20"
        y="175"
        fontFamily="var(--font-quicksand), Nunito, 'Arial Rounded MT Bold', sans-serif"
        fontWeight="800"
        fontSize="200"
        letterSpacing="-4"
        fill={fill}
      >
        Dorika
      </text>
      {/* Terracotta thread sweep */}
      <path
        d="M 40 225 C 300 195, 640 250, 980 205"
        fill="none"
        stroke="#C55A29"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <g fill="#C55A29">
        <circle cx="40" cy="224" r="9" />
        <path
          d="M 33 227 L 29 233 M 47 229 L 51 234"
          stroke="#C55A29"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <circle cx="980" cy="205" r="9" />
        <circle cx="986" cy="208" r="5.5" />
      </g>
    </svg>
  );

  if (!withLink) return svg;
  return (
    <Link href="/" aria-label="Dorika — home" className="inline-flex items-center">
      {svg}
    </Link>
  );
}

/** Compact mark (the thread knot) for favicon / tight spaces. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn("h-8 w-8", className)} role="img" aria-label="Dorika">
      <rect width="64" height="64" rx="14" fill="#24272B" />
      <path
        d="M 12 38 C 24 30, 40 46, 52 34"
        fill="none"
        stroke="#C55A29"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="38" r="4.5" fill="#C55A29" />
      <circle cx="52" cy="34" r="4.5" fill="#C55A29" />
      <text
        x="32"
        y="24"
        textAnchor="middle"
        fontFamily="Quicksand, sans-serif"
        fontWeight="800"
        fontSize="20"
        fill="#FFFFFF"
      >
        D
      </text>
    </svg>
  );
}
