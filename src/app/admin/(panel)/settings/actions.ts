"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile } from "@/lib/auth";

/** Trim a field and turn "" into null. */
function text(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

/**
 * Columns added by supabase/04_payments.sql. They are checked for separately
 * because a database that predates that migration can still save every other
 * field — refusing the whole save would block editing the hero or delivery fee.
 */
const PAYMENT_COLUMNS = [
  "esewa_id",
  "khalti_id",
  "bank_name",
  "bank_account_name",
  "bank_account_number",
  "bank_qr_url",
  "payment_note",
] as const;

const MISSING_PAYMENT_COLUMNS_WARNING =
  "Saved, except the payment details. The database has no columns for them yet, so eSewa / Khalti / bank fields were not stored. Run supabase/04_payments.sql in the Supabase SQL editor, then save once more.";

/** PostgREST's wording for "this column is not in the table". */
function isMissingColumn(message: string): boolean {
  return /schema cache|could not find the .* column|column .* does not exist|unknown column/i.test(
    message,
  );
}

/**
 * Save the settings row.
 *
 * History: this used to run `await supabase.from("settings").update(payload)`
 * and throw the result away. Any failure — a column the database does not have,
 * a blocked RLS policy, a rotated service key — left the page showing the old
 * values with no message at all, which reads as "the button does nothing".
 * Four things changed:
 *
 *  1. The role is re-checked here. A server action is its own entry point, so
 *     the middleware and layout guards do not cover it.
 *  2. The write goes through the service-role client once the role is proven,
 *     so a misbehaving is_admin() policy cannot silently update zero rows.
 *     The session client is the fallback if the service key is missing.
 *  3. `.select()` exposes "0 rows updated", which PostgREST otherwise reports
 *     as a plain success.
 *  4. If the payment columns are absent, the save retries without them and
 *     says so, instead of failing as a whole.
 */
export async function saveSettings(formData: FormData) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") {
    redirect("/admin/login?error=not_admin");
  }

  const payload: Record<string, unknown> = {
    store_name: String(formData.get("store_name") ?? "").trim(),
    store_email: String(formData.get("store_email") ?? "").trim(),
    store_phone: String(formData.get("store_phone") ?? "").trim(),
    whatsapp: String(formData.get("whatsapp") ?? "").trim(),
    address: String(formData.get("address") ?? "").trim(),
    currency: String(formData.get("currency") ?? "NPR").trim(),
    delivery_fee: Number(formData.get("delivery_fee") ?? 0),
    free_delivery_over: Number(formData.get("free_delivery_over") ?? 0),
    custom_art_price: Number(formData.get("custom_art_price") ?? 0),
    custom_art_days: String(formData.get("custom_art_days") ?? "").trim(),
    hero_headline: String(formData.get("hero_headline") ?? "").trim(),
    hero_tagline: String(formData.get("hero_tagline") ?? "").trim(),
    cod_enabled: formData.get("cod_enabled") === "on",
    esewa_enabled: formData.get("esewa_enabled") === "on",
    khalti_enabled: formData.get("khalti_enabled") === "on",
    bank_enabled: formData.get("bank_enabled") === "on",
    // Manual payment destinations — blank strings become null so checkout
    // can treat "not configured" and "cleared" the same way.
    esewa_id: text(formData.get("esewa_id")),
    khalti_id: text(formData.get("khalti_id")),
    bank_name: text(formData.get("bank_name")),
    bank_account_name: text(formData.get("bank_account_name")),
    bank_account_number: text(formData.get("bank_account_number")),
    bank_qr_url: text(formData.get("bank_qr_url")),
    payment_note: text(formData.get("payment_note")),
  };

  const { error, warning } = await writeSettings(payload);

  // Settings feed the homepage hero, delivery fees, etc.
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/custom-art");

  if (error) {
    redirect(`/admin/settings?error=${encodeURIComponent(error)}`);
  }
  redirect(
    warning
      ? `/admin/settings?saved=1&warning=${encodeURIComponent(warning)}`
      : "/admin/settings?saved=1",
  );
}

type AdminishClient = ReturnType<typeof createAdminClient>;
type WriteResult = { error: string | null; rows: number };

/** One UPDATE attempt. `.select()` turns "matched nothing" into observable data. */
async function attempt(
  client: AdminishClient,
  payload: Record<string, unknown>,
): Promise<WriteResult> {
  const { data, error } = await client
    .from("settings")
    .update(payload)
    .eq("id", 1)
    .select("id");

  return {
    error: error ? error.message : null,
    rows: data?.length ?? 0,
  };
}

/**
 * Update row 1 and report what actually happened. Tries the service-role client
 * first (RLS cannot reject it, and the admin role was verified above), then the
 * session client if the service key is missing or stale.
 */
async function writeSettings(
  payload: Record<string, unknown>,
): Promise<{ error: string | null; warning: string | null }> {
  const clients: { label: string; client: AdminishClient }[] = [];

  try {
    clients.push({ label: "service role", client: createAdminClient() });
  } catch {
    // Missing/blank service key — the session client below is the fallback.
  }
  clients.push({ label: "session", client: createClient() as AdminishClient });

  const problems: string[] = [];

  for (const { label, client } of clients) {
    const full = await attempt(client, payload);

    if (!full.error && full.rows > 0) {
      return { error: null, warning: null };
    }

    if (full.error && isMissingColumn(full.error)) {
      const reduced = { ...payload };
      for (const key of PAYMENT_COLUMNS) delete reduced[key];

      const retry = await attempt(client, reduced);
      if (!retry.error && retry.rows > 0) {
        return { error: null, warning: MISSING_PAYMENT_COLUMNS_WARNING };
      }
      problems.push(
        `${label}: ${retry.error ?? "updated 0 rows, so nothing changed"}`,
      );
      continue;
    }

    problems.push(
      full.error ??
        `${label}: the database accepted the request but updated 0 rows — the row with id = 1 is missing, or row-level security blocked the write.`,
    );
  }

  return { error: problems.join(" · "), warning: null };
}
