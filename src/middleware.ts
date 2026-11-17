import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    // Only run session refresh + auth guards on the protected areas.
    // ~99% of traffic is anonymous storefront browsing, which needs neither.
    "/admin/:path*",
    "/account/:path*",
  ],
};
