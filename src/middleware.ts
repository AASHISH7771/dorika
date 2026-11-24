import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * The only host we want customers to see.
 *
 * Render assigns `<service>.onrender.com` automatically and it cannot be
 * deleted — it lives as long as the service does. So instead of trying to
 * remove it, we make it invisible: anything arriving on that host is
 * permanently redirected here, which keeps a single canonical URL for
 * visitors, shared links and search engines.
 */
const CANONICAL_HOST = "dorika.shop";

/**
 * Paths that must keep answering on *every* host, never redirect:
 *   /api/*   — Render's health probe lives at /api/health, and uptime
 *              monitors hit it directly. Redirecting would turn a clean
 *              200 into a 3xx and confuse both.
 *   /_next/* — build assets; the browser asks for these on whatever host
 *              it already loaded the page from.
 */
function isHostAgnostic(pathname: string): boolean {
  return pathname.startsWith("/api/") || pathname.startsWith("/_next/");
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const host = (request.headers.get("host") ?? "").toLowerCase();

  const isRenderSubdomain = host.endsWith(".onrender.com");
  const isWww = host === `www.${CANONICAL_HOST}`;

  /**
   * www → apex, 301.
   *
   * The wildcard certificate now validates, so www.dorika.shop answers 200
   * with an identical copy of the site. Left alone that is a textbook
   * duplicate-content setup — two hosts, same bytes. The canonical tag is the
   * hint; this redirect is the instruction. 301 (not 308) because www → apex
   * is a permanent, semantic move rather than a method-preserving replay.
   */
  if (
    process.env.NODE_ENV === "production" &&
    isWww &&
    !isHostAgnostic(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // 308 keeps the method and body intact for any non-GET request, so a
  // POST that lands on the old host still reaches the right handler.
  if (
    process.env.NODE_ENV === "production" &&
    isRenderSubdomain &&
    !isHostAgnostic(pathname)
  ) {
    const url = request.nextUrl.clone();
    url.protocol = "https:";
    url.host = CANONICAL_HOST;
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  /**
   * The customer account area is gone. Sign-in now exists only for the shop
   * owner, at /admin/login — so /account is not a page anyone should reach.
   * Old bookmarks, shared links and any indexed /account URL get sent home
   * instead of a 404.
   */
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url, 301);
  }

  // Session refresh + auth guard are only needed on the admin area.
  // The storefront is anonymous browsing and gets no middleware work.
  if (pathname.startsWith("/admin")) {
    return await updateSession(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Everything except static files and image assets — those are served
    // as-is from whichever host the page was loaded on.
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|webmanifest)$).*)",
  ],
};
