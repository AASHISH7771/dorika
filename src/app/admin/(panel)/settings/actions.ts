"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
  };

  await supabase.from("settings").update(payload).eq("id", 1);

  // Settings feed the homepage hero, delivery fees, etc.
  revalidatePath("/admin/settings");
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/checkout");
  revalidatePath("/custom-art");
}
