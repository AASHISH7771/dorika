import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";

/**
 * The cart page itself is a client component, so it cannot export metadata.
 * This layout owns it instead: a real title (previously /cart inherited the
 * homepage <title>, competing with "/" as a duplicate) and a noindex, so a
 * personalised, always-empty-to-a-crawler page stays out of the index.
 */
export const metadata: Metadata = pageMetadata({
  title: "Your Cart",
  description: "Review the pieces in your Dorika cart before checkout.",
  path: "/cart",
  noindex: true,
});

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return children;
}
