"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cleanBody, isUuid } from "@/lib/support/chat-server";

/**
 * Server Actions are reachable by POST from anywhere, so the admin check has
 * to happen here and not only in the layout that renders the form.
 */
async function assertAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "admin") redirect("/admin/login");
  return profile;
}

export async function replyToThread(formData: FormData) {
  await assertAdmin();

  const id = String(formData.get("id") ?? "");
  const body = cleanBody(formData.get("body"));
  if (!isUuid(id) || !body) {
    redirect(`/admin/support/${id}?error=empty`);
  }

  const admin = createAdminClient();

  const { error } = await admin
    .from("support_messages")
    .insert({ thread_id: id, role: "staff", body });

  if (error) {
    redirect(`/admin/support/${id}?error=send`);
  }

  // A staff reply means this is a live human conversation now. The assistant
  // stays off — `ai_enabled` is not touched here on purpose.
  await admin
    .from("support_threads")
    .update({
      status: "staff_chat",
      unread_for_staff: 0,
      last_message_at: new Date().toISOString(),
    })
    .eq("id", id);

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
  redirect(`/admin/support/${id}?sent=1`);
}

export async function closeThread(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;

  const admin = createAdminClient();
  await admin
    .from("support_threads")
    .update({ status: "closed", ai_enabled: false, unread_for_staff: 0 })
    .eq("id", id);

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
}

/** Reopens a closed chat so staff can keep replying. */
export async function reopenThread(formData: FormData) {
  await assertAdmin();
  const id = String(formData.get("id") ?? "");
  if (!isUuid(id)) return;

  const admin = createAdminClient();
  await admin.from("support_threads").update({ status: "awaiting_staff" }).eq("id", id);

  revalidatePath("/admin/support");
  revalidatePath(`/admin/support/${id}`);
}
