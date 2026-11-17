"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { slugify } from "@/lib/utils";
import type { Product, Category } from "@/lib/types";

export function ProductForm({
  product,
  categories,
  action,
}: {
  product?: Product;
  categories: Category[];
  action: (formData: FormData) => void;
}) {
  const [images, setImages] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(!!product);
  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploadError(null);
    setUploading(true);
    const supabase = createClient();
    const uploaded: string[] = [];
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${slugify(name || "product") || "product"}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}.${ext}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) {
          setUploadError(error.message);
          continue;
        }
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        if (data?.publicUrl) uploaded.push(data.publicUrl);
      }
      setImages((prev) => [...prev, ...uploaded]);
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((x) => x !== url));
  }
  function move(url: string, dir: -1 | 1) {
    setImages((prev) => {
      const i = prev.indexOf(url);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <form action={action} className="space-y-6">
      {product && <input type="hidden" name="id" value={product.id} />}
      <input type="hidden" name="images" value={images.join(",")} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-5 lg:col-span-2">
          <div className="card space-y-4 p-5">
            <Field label="Name" htmlFor="name" required>
              <Input
                id="name"
                name="name"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (!slugTouched) setSlug(slugify(e.target.value));
                }}
                placeholder="Rose String Art"
              />
            </Field>
            <Field label="Slug" htmlFor="slug" hint="Used in the product URL. Auto-filled from the name.">
              <Input
                id="slug"
                name="slug"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="rose-string-art"
              />
            </Field>
            <Field label="Description" htmlFor="description">
              <Textarea
                id="description"
                name="description"
                defaultValue={product?.description ?? ""}
                placeholder="A short, warm description of the piece…"
              />
            </Field>
          </div>

          {/* Images */}
          <div className="card p-5">
            <div className="mb-3 flex items-center justify-between">
              <label className="label !mb-0">Images</label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-outline btn-sm"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : "Upload"}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            {uploadError && <p className="mb-3 text-sm text-red-600">{uploadError}</p>}
            {images.length === 0 ? (
              <p className="rounded-xl bg-cream-200 px-4 py-6 text-center text-sm text-charcoal-400">
                No images yet. The first image is used as the cover.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((url, i) => (
                  <div key={url} className="group relative aspect-square overflow-hidden rounded-xl bg-cream-200">
                    <Image src={url} alt="" fill sizes="120px" className="object-cover" unoptimized />
                    {i === 0 && (
                      <span className="absolute left-1 top-1 rounded bg-charcoal-800/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
                        Cover
                      </span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-charcoal-900/60 p-1 opacity-0 transition group-hover:opacity-100">
                      <button type="button" onClick={() => move(url, -1)} className="text-xs text-white">
                        ◀
                      </button>
                      <button type="button" onClick={() => removeImage(url)} aria-label="Remove">
                        <X className="h-4 w-4 text-white" />
                      </button>
                      <button type="button" onClick={() => move(url, 1)} className="text-xs text-white">
                        ▶
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <div className="card space-y-4 p-5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Price (Rs.)" htmlFor="price" required>
                <Input id="price" name="price" type="number" min={0} step={100} required defaultValue={product?.price ?? ""} />
              </Field>
              <Field label="Compare at" htmlFor="compare_at" hint="Optional">
                <Input id="compare_at" name="compare_at" type="number" min={0} step={100} defaultValue={product?.compare_at ?? ""} />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Stock" htmlFor="stock" required>
                <Input id="stock" name="stock" type="number" min={0} required defaultValue={product?.stock ?? 0} />
              </Field>
              <Field label="Size" htmlFor="size">
                <Input id="size" name="size" defaultValue={product?.size ?? ""} placeholder="45cm" />
              </Field>
            </div>
            <Field label="Category" htmlFor="category_id">
              <Select id="category_id" name="category_id" defaultValue={product?.category_id ?? ""}>
                <option value="">Uncategorised</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.is_active ? " (inactive)" : ""}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="card space-y-3 p-5">
            <Toggle name="is_active" label="Active (visible in shop)" defaultChecked={product ? product.is_active : true} />
            <Toggle name="is_featured" label="Featured on homepage" defaultChecked={product?.is_featured ?? false} />
            <Toggle name="is_custom" label="Custom art product" defaultChecked={product?.is_custom ?? false} />
          </div>

          <button type="submit" className="btn-primary btn-lg w-full">
            {product ? "Save changes" : "Create product"}
          </button>
        </div>
      </div>
    </form>
  );
}

function Toggle({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
      <span className="font-medium text-charcoal-700">{label}</span>
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative h-6 w-11 rounded-full bg-charcoal-200 transition peer-checked:bg-terracotta-500 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-5" />
    </label>
  );
}
