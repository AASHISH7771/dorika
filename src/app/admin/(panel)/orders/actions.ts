"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

// Update an order's status, append a timeline event, and refresh the storefront
// tracking + admin views. Admin RLS enforces access server-side.
export async function updateOrderStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as OrderStatus;
  const note = String(formData.get("note") ?? "").trim();
  if (!id || !status) return;

  const supabase = createClient();
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) return;

  await supabase.from("order_events").insert({
    order_id: id,
    status,
    note: note || null,
  });

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/track");
}

export async function updateOrderPayment(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const payment_status = String(formData.get("payment_status") ?? "") as PaymentStatus;
  if (!id || !payment_status) return;

  const supabase = createClient();
  await supabase.from("orders").update({
    payment_status,
    // Stamp the confirmation time so a day's transfers can be reconciled later.
    paid_at: payment_status === "paid" ? new Date().toISOString() : null,
  }).eq("id", id);

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/payments");
}
