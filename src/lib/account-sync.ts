import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";

// ─────────────────────────────────────────────────────────────
//  Post-auth housekeeping for customer accounts.
//
//  Dorika is guest-first: most orders are placed without an
//  account. When someone finally signs up (or logs in) we:
//    1. fill in any profile fields the signup form collected but
//       the DB trigger could not (phone lives in metadata),
//    2. call link_guest_orders() so their past guest orders and
//       custom-art requests attach to the account by phone/email.
//  Both steps are best-effort — a failure must never block login.
// ─────────────────────────────────────────────────────────────
export async function syncCustomerAccount(
  supabase: SupabaseClient,
  user: User
): Promise<void> {
  try {
    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const metaPhone = typeof meta.phone === "string" ? meta.phone.trim() : "";
    const metaName =
      typeof meta.full_name === "string" ? meta.full_name.trim() : "";

    const { data: profile } = await supabase
      .from("profiles")
      .select("phone, full_name")
      .eq("id", user.id)
      .maybeSingle();

    const patch: Record<string, string> = {};
    if (!profile?.phone && metaPhone) patch.phone = metaPhone;
    if (!profile?.full_name && metaName) patch.full_name = metaName;

    if (Object.keys(patch).length > 0) {
      await supabase.from("profiles").update(patch).eq("id", user.id);
    }

    await supabase.rpc("link_guest_orders");
  } catch {
    // Supabase not configured, RPC not installed yet, or offline — ignore.
  }
}
