import { createClient as createJsClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. SERVER-ONLY.
// Used by server actions / route handlers for guest order creation,
// private photo uploads, and admin operations after a verified role check.
// NEVER import this into a client component.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing SUPABASE env vars (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  return createJsClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
