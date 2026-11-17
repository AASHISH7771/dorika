import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";
import type { Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = createClient();
  const { data } = await supabase.from("categories").select("*").order("sort_order");
  const categories = (data as Category[]) ?? [];

  // Product counts per category
  const { data: products } = await supabase.from("products").select("category_id");
  const counts = new Map<string, number>();
  (products as { category_id: string | null }[] | null)?.forEach((p) => {
    if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
  });

  const rows = categories.map((c) => ({ ...c, product_count: counts.get(c.id) ?? 0 }));

  return (
    <>
      <PageHeader title="Categories" subtitle="Organise your shop. Deleting a category keeps its products (they become uncategorised)." />
      <CategoryManager categories={rows} />
    </>
  );
}
