"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setMessageRead(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const is_read = formData.get("is_read") === "true";
  if (!id) return;
  const supabase = createClient();
  await supabase.from("contact_messages").update({ is_read }).eq("id", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  await supabase.from("contact_messages").delete().eq("id", id);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}
