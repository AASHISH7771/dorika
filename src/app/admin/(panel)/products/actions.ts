"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function revalidateStore(slug?: string) {
  revalidatePath("/");
  revalidatePath("/shop");
  revalidatePath("/admin/products");
  if (slug) revalidatePath(`/product/${slug}`);
}

function parseForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const images = String(formData.get("images") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const compareRaw = String(formData.get("compare_at") ?? "").trim();
  const categoryRaw = String(formData.get("category_id") ?? "").trim();
  return {
    name,
    slug: slugInput ? slugify(slugInput) : slugify(name),
    description: String(formData.get("description") ?? "").trim() || null,
    price: Number(formData.get("price") ?? 0),
    compare_at: compareRaw ? Number(compareRaw) : null,
    category_id: categoryRaw || null,
    size: String(formData.get("size") ?? "").trim() || null,
    stock: Number(formData.get("stock") ?? 0),
    images,
    is_featured: formData.get("is_featured") === "on",
    is_active: formData.get("is_active") === "on",
    is_custom: formData.get("is_custom") === "on",
  };
}

export async function createProduct(formData: FormData) {
  const payload = parseForm(formData);
  if (!payload.name || !Number.isFinite(payload.price)) return;

  const supabase = createClient();
  const { error } = await supabase.from("products").insert(payload);
  if (error) {
    redirect(`/admin/products/new?error=${encodeURIComponent(error.message)}`);
  }
  revalidateStore(payload.slug);
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const payload = parseForm(formData);

  const supabase = createClient();
  const { error } = await supabase.from("products").update(payload).eq("id", id);
  if (error) {
    redirect(`/admin/products/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }
  revalidateStore(payload.slug);
  redirect("/admin/products");
}

export async function toggleProductFlag(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const field = String(formData.get("field") ?? "");
  const value = formData.get("value") === "true";
  if (!id || !["is_active", "is_featured"].includes(field)) return;

  const supabase = createClient();
  await supabase.from("products").update({ [field]: !value }).eq("id", id);
  revalidateStore();
}

export async function deleteProduct(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const supabase = createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidateStore();
  redirect("/admin/products");
}
