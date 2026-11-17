"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CustomStatus, PaymentStatus } from "@/lib/types";

export async function updateCustomStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as CustomStatus;
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !status) return;

  const supabase = createClient();
  const { error } = await supabase.from("custom_requests").update({ status }).eq("id", id);
  if (error) return;

  await supabase.from("custom_events").insert({
    request_id: id,
    status,
    note: note || null,
  });

  revalidatePath(`/admin/custom-requests/${id}`);
  revalidatePath("/admin/custom-requests");
  revalidatePath("/admin");
  revalidatePath("/track");
}

export async function updateCustomPrice(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const price = Number(formData.get("price") ?? 0);
  if (!id || !Number.isFinite(price) || price < 0) return;

  const supabase = createClient();
  await supabase.from("custom_requests").update({ price }).eq("id", id);
  revalidatePath(`/admin/custom-requests/${id}`);
}

export async function updateCustomNotes(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const admin_notes = String(formData.get("admin_notes") ?? "").trim();
  if (!id) return;

  const supabase = createClient();
  await supabase.from("custom_requests").update({ admin_notes: admin_notes || null }).eq("id", id);
  revalidatePath(`/admin/custom-requests/${id}`);
}

export async function updateCustomPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "") as PaymentStatus;
  if (!id || !payment_status) return;

  const supabase = createClient();
  await supabase.from("custom_requests").update({ payment_status }).eq("id", id);
  revalidatePath(`/admin/custom-requests/${id}`);
}
