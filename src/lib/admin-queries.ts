import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

// Admin-scoped reads (RLS admin policy returns inactive rows too).

export async function getAllCategories(): Promise<Category[]> {
  try {
    const supabase = createClient();
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    return (data as Category[]) ?? [];
  } catch {
    return [];
  }
}
