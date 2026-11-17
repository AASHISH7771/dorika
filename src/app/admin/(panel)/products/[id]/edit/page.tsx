import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { updateProduct, deleteProduct } from "../../actions";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const [{ data }, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    getAllCategories(),
  ]);
  const product = data as Product | null;
  if (!product) notFound();

  return (
    <>
      <Link href="/admin/products" className="btn-ghost btn-sm mb-4">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader
        title="Edit product"
        action={
          <form action={deleteProduct}>
            <input type="hidden" name="id" value={product.id} />
            <button type="submit" className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> Delete
            </button>
          </form>
        }
      />
      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <ProductForm product={product} categories={categories} action={updateProduct} />
    </>
  );
}
