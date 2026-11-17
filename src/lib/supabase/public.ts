import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
//  Stateless, cookie-free Supabase client for PUBLIC reads.
//
//  Why this exists: the cookie-bound client in `server.ts` calls
//  `cookies()`, which is illegal inside a statically generated page.
//  The product pages use `generateStaticParams` + `revalidate`, so
//  any `cookies()` call there makes Next throw
//  "Page changed from static to dynamic at runtime, reason: cookies"
//  → a hard 500 in production for every /product/[slug] request.
//
//  Storefront data (products, categories, settings) is public and
//  protected by RLS "public read" policies, so no session is
//  involved. Never use this client for per-user data — use
//  `server.ts` for that.
// ─────────────────────────────────────────────────────────────
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        // Public reads are cacheable; let Next's fetch cache handle it.
        headers: { "x-dorika-client": "public-read" },
      },
    }
  );
}
