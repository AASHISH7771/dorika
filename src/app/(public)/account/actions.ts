"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { isValidNepaliPhone, normalizePhone } from "@/lib/utils";

const LOGIN = "/account/auth/login";

// ── Sign out ─────────────────────────────────────────────────
export async function signOutCustomer() {
  if (isSupabaseConfigured()) {
    const supabase = createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

// ── Profile ──────────────────────────────────────────────────
export async function updateProfileAction(formData: FormData) {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));

  if (!isSupabaseConfigured()) redirect("/account/profile?error=not_configured");
  if (!fullName) redirect("/account/profile?error=name");
  if (phone && !isValidNepaliPhone(phone)) redirect("/account/profile?error=phone");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN);

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null })
    .eq("id", user.id);

  if (error) redirect("/account/profile?error=failed");

  // Keep the auth record in sync so guest-order linking still matches.
  await supabase.auth.updateUser({ data: { full_name: fullName, phone } });

  revalidatePath("/account/profile");
  revalidatePath("/account");
  redirect("/account/profile?ok=saved");
}

// ── Addresses ────────────────────────────────────────────────
export async function saveAddressAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const label = String(formData.get("label") ?? "").trim();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const district = String(formData.get("district") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const landmark = String(formData.get("landmark") ?? "").trim();
  const isDefault = formData.get("is_default") === "on";

  if (!isSupabaseConfigured()) redirect("/account/addresses?error=not_configured");
  if (!fullName || !phone || !district || !address) {
    redirect("/account/addresses?error=required");
  }
  if (!isValidNepaliPhone(phone)) redirect("/account/addresses?error=phone");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN);

  const payload = {
    user_id: user.id,
    label: label || "Home",
    full_name: fullName,
    phone,
    district,
    city: city || null,
    address,
    landmark: landmark || null,
    is_default: isDefault,
  };

  if (isDefault) {
    // Only one default address at a time.
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { error } = id
    ? await supabase.from("addresses").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("addresses").insert(payload);

  if (error) redirect("/account/addresses?error=failed");

  revalidatePath("/account/addresses");
  revalidatePath("/account");
  redirect("/account/addresses?ok=saved");
}

export async function deleteAddressAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!isSupabaseConfigured() || !id) redirect("/account/addresses?error=failed");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN);

  const { error } = await supabase
    .from("addresses")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirect("/account/addresses?error=failed");

  revalidatePath("/account/addresses");
  revalidatePath("/account");
  redirect("/account/addresses?ok=deleted");
}

export async function setDefaultAddressAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!isSupabaseConfigured() || !id) redirect("/account/addresses?error=failed");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN);

  await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  const { error } = await supabase
    .from("addresses")
    .update({ is_default: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) redirect("/account/addresses?error=failed");

  revalidatePath("/account/addresses");
  redirect("/account/addresses?ok=default");
}

// ── Re-attach past guest orders on demand ────────────────────
export async function claimGuestOrdersAction() {
  if (!isSupabaseConfigured()) redirect("/account?error=not_configured");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(LOGIN);

  const { error } = await supabase.rpc("link_guest_orders");
  if (error) redirect("/account?error=claim_failed");

  revalidatePath("/account");
  revalidatePath("/account/orders");
  redirect("/account?ok=claimed");
}
