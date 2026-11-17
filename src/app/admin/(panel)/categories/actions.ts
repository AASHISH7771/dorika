"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function refresh() {
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function saveCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const slugInput = String(formData.get("slug") ?? "").trim();

  const payload = {
    name,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    description: String(formData.get("description") ?? "").trim() || null,
    image_url: String(formData.get("image_url") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0),
    is_active: formData.get("is_active") === "on",
  };

  const supabase = createClient();
  if (id) {
    await supabase.from("categories").update(payload).eq("id", id);
  } else {
    await supabase.from("categories").insert(payload);
  }
  refresh();
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  // FK is ON DELETE SET NULL → products become uncategorised, not deleted.
  await supabase.from("categories").delete().eq("id", id);
  refresh();
}
