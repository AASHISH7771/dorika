"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

/** Trim a field and turn "" into null. */
function text(value: FormDataEntryValue | null): string | null {
  const v = String(value ?? "").trim();
  return v.length ? v : null;
}

export async function saveSettings(formData: FormData) {
  const supabase = createClient();

  const payload = {
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

  await supabase.from("settings").update(payload).eq("id", 1);

  // Settings feed the homepage hero, delivery fees, etc.
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/custom-art");
}
