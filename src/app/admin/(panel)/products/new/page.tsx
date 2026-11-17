import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getAllCategories } from "@/lib/admin-queries";
import { ProductForm } from "@/components/admin/product-form";
import { PageHeader } from "@/components/admin/ui";
import { createProduct } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: { error?: string } }) {
  const categories = await getAllCategories();
  return (
    <>
      <Link href="/admin/products" className="btn-ghost btn-sm mb-4">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>
      <PageHeader title="Add product" />
      {searchParams.error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <ProductForm categories={categories} action={createProduct} />
    </>
  );
}
