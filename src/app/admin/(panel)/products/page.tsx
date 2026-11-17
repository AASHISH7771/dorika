import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { formatNPR } from "@/lib/utils";
import { productImage } from "@/lib/config";
import { toggleProductFlag } from "./actions";
import type { Product, Category } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(name)")
    .order("created_at", { ascending: false });
  const products = (data as (Product & { category?: Pick<Category, "name"> | null })[]) ?? [];

  return (
    <>
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"}`}
        action={
          <Link href="/admin/products/new" className="btn-primary btn-sm">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        }
      />

      {products.length === 0 ? (
        <EmptyState title="No products yet" hint="Add your first piece to the shop.">
          <Link href="/admin/products/new" className="btn-primary btn-md">
            <Plus className="h-4 w-4" /> Add product
          </Link>
        </EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Product</th>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Price</th>
                  <th className="px-4 py-3 font-semibold">Stock</th>
                  <th className="px-4 py-3 font-semibold">Featured</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {products.map((p) => (
                  <tr key={p.id} className={p.stock <= 5 && !p.is_custom ? "bg-amber-50/50" : "hover:bg-cream-100"}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-cream-200">
                          <Image
                            src={productImage(p.images, 0)}
                            alt={p.name}
                            fill
                            sizes="40px"
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="font-medium text-charcoal-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-charcoal-500">{p.category?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-medium">{formatNPR(p.price)}</td>
                    <td className="px-4 py-3">
                      <span className={p.stock <= 5 && !p.is_custom ? "font-bold text-amber-700" : ""}>
                        {p.is_custom ? "∞" : p.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <FlagToggle id={p.id} field="is_featured" value={p.is_featured} />
                    </td>
                    <td className="px-4 py-3">
                      <FlagToggle id={p.id} field="is_active" value={p.is_active} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta-600 hover:underline"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

function FlagToggle({ id, field, value }: { id: string; field: "is_featured" | "is_active"; value: boolean }) {
  return (
    <form action={toggleProductFlag}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="field" value={field} />
      <input type="hidden" name="value" value={String(value)} />
      <button
        type="submit"
        className={
          "relative h-5 w-9 rounded-full transition " + (value ? "bg-terracotta-500" : "bg-charcoal-200")
        }
        aria-label={`Toggle ${field}`}
      >
        <span
          className={
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition " +
            (value ? "left-[18px]" : "left-0.5")
          }
        />
      </button>
    </form>
  );
}
