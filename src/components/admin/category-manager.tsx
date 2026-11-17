"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import type { Category } from "@/lib/types";
import { saveCategory, deleteCategory } from "@/app/admin/(panel)/categories/actions";

type Row = Category & { product_count: number };

export function CategoryManager({ categories }: { categories: Row[] }) {
  const [editing, setEditing] = useState<Row | "new" | null>(null);

  return (
    <>
      <div className="mb-5 flex justify-end">
        <button onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus className="h-4 w-4" /> Add category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white/60 px-6 py-16 text-center">
          <h3 className="text-lg font-bold text-charcoal-700">No categories yet</h3>
          <button onClick={() => setEditing("new")} className="btn-primary btn-md mt-5">
            <Plus className="h-4 w-4" /> Add category
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-cream-200 text-left text-xs uppercase tracking-wide text-charcoal-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Slug</th>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Products</th>
                  <th className="px-4 py-3 font-semibold">Active</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-charcoal-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-cream-100">
                    <td className="px-4 py-3 font-medium text-charcoal-800">{c.name}</td>
                    <td className="px-4 py-3 text-charcoal-500">{c.slug}</td>
                    <td className="px-4 py-3 text-charcoal-500">{c.sort_order}</td>
                    <td className="px-4 py-3 text-charcoal-500">{c.product_count}</td>
                    <td className="px-4 py-3">
                      <span className={"badge " + (c.is_active ? "bg-green-100 text-green-800" : "bg-charcoal-100 text-charcoal-500")}>
                        {c.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setEditing(c)}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-terracotta-600 hover:underline"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-1 text-sm font-semibold text-red-600 hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {editing && (
        <CategoryModal category={editing === "new" ? undefined : editing} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function CategoryModal({ category, onClose }: { category?: Category; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-charcoal-900/50" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-float sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-extrabold">{category ? "Edit category" : "Add category"}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg p-1.5 hover:bg-charcoal-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form action={saveCategory} onSubmit={() => setTimeout(onClose, 50)} className="space-y-4">
          {category && <input type="hidden" name="id" value={category.id} />}
          <Field label="Name" htmlFor="c-name" required>
            <Input id="c-name" name="name" required defaultValue={category?.name ?? ""} placeholder="Wall Art" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Slug" htmlFor="c-slug" hint="Auto from name">
              <Input id="c-slug" name="slug" defaultValue={category?.slug ?? ""} placeholder="wall-art" />
            </Field>
            <Field label="Sort order" htmlFor="c-sort">
              <Input id="c-sort" name="sort_order" type="number" defaultValue={category?.sort_order ?? 0} />
            </Field>
          </div>
          <Field label="Description" htmlFor="c-desc">
            <Textarea id="c-desc" name="description" defaultValue={category?.description ?? ""} />
          </Field>
          <Field label="Image URL" htmlFor="c-img" hint="Optional tile image">
            <Input id="c-img" name="image_url" defaultValue={category?.image_url ?? ""} placeholder="https://…" />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" name="is_active" defaultChecked={category ? category.is_active : true} />
            Active (visible in shop)
          </label>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-outline btn-md flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary btn-md flex-1">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
