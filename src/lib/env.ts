// ─────────────────────────────────────────────────────────────
//  Dorika — environment helpers
//
//  The app is designed to boot before Supabase keys are added:
//  the storefront renders, and auth/account screens show a
//  friendly "connect Supabase" state instead of crashing.
// ─────────────────────────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    !!url &&
    !!anonKey &&
    url.startsWith("http") &&
    !url.includes("your-project-ref")
  );
}

export function isServiceRoleConfigured(): boolean {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return !!key && key.length > 20;
}
