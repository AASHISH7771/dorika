import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Product, Category, Settings } from "@/lib/types";

// All queries are read-only and respect RLS (public read on active rows).
// They return safe fallbacks on error so pages never crash before Supabase
// is configured.

export async function getSettings(): Promise<Settings | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
    return (data as Settings) ?? null;
  } catch {
    return null;
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("is_featured", true)
      .order("created_at", { ascending: false })
      .limit(limit);
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

export interface ShopQuery {
  search?: string;
  category?: string; // slug
  sort?: "newest" | "price_asc" | "price_desc";
  page?: number;
  perPage?: number;
}

export async function getProducts(q: ShopQuery = {}): Promise<{ products: Product[]; total: number }> {
  const { search, category, sort = "newest", page = 1, perPage = 9 } = q;
  try {
    const supabase = createClient();
    let query = supabase
      .from("products")
      .select("*, category:categories!inner(*)", { count: "exact" })
      .eq("is_active", true);

    if (search) query = query.ilike("name", `%${search}%`);
    if (category) query = query.eq("category.slug", category);

    if (sort === "price_asc") query = query.order("price", { ascending: true });
    else if (sort === "price_desc") query = query.order("price", { ascending: false });
    else query = query.order("created_at", { ascending: false });

    const from = (page - 1) * perPage;
    query = query.range(from, from + perPage - 1);

    const { data, count } = await query;
    return { products: (data as Product[]) ?? [], total: count ?? 0 };
  } catch {
    return { products: [], total: 0 };
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();
    return (data as Product) ?? null;
  } catch {
    return null;
  }
}

export async function getRelatedProducts(
  categoryId: string | null,
  excludeId: string,
  limit = 4
): Promise<Product[]> {
  if (!categoryId) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .eq("is_active", true)
      .eq("category_id", categoryId)
      .neq("id", excludeId)
      .limit(limit);
    return (data as Product[]) ?? [];
  } catch {
    return [];
  }
}

// Fetch a set of products by id (used by the public wishlist page).
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids || ids.length === 0) return [];
  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("*, category:categories(*)")
      .in("id", ids)
      .eq("is_active", true);
    // Preserve the caller's id order
    const map = new Map((data as Product[] | null)?.map((p) => [p.id, p]) ?? []);
    return ids.map((id) => map.get(id)).filter(Boolean) as Product[];
  } catch {
    return [];
  }
}

export async function getAllProductSlugs(): Promise<string[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("products").select("slug").eq("is_active", true);
    return (data ?? []).map((r: { slug: string }) => r.slug);
  } catch {
    return [];
  }
}
