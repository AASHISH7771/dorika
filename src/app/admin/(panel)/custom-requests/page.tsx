import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, StatusBadge, PaymentBadge, EmptyState } from "@/components/admin/ui";
import { AdminFilters } from "@/components/admin/admin-filters";
import { formatNPR, formatDate, statusLabel } from "@/lib/utils";
import type { CustomRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS = (["pending", "confirmed", "in_progress", "shipped", "delivered", "cancelled"] as const).map(
  (s) => ({ value: s, label: statusLabel[s] })
);

async function signThumbs(rows: CustomRequest[]): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const admin = createAdminClient();
    const results = await Promise.all(
      rows.map(async (r) =>
        r.photo_path
          ? admin.storage.from("custom-photos").createSignedUrl(r.photo_path, 60 * 60)
          : null
      )
    );
    rows.forEach((r, i) => {
      const signed = results[i]?.data?.signedUrl;
      if (signed) map[r.id] = signed;
    });
  } catch {
    /* service role not configured yet — thumbnails simply won't render */
  }
  return map;
}

export default async function CustomRequestsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const supabase = createClient();
  let query = supabase.from("custom_requests").select("*").order("created_at", { ascending: false });

  if (searchParams.q) {
    const q = searchParams.q.replace(/[%,]/g, "");
    query = query.or(`request_no.ilike.%${q}%,full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data } = await query.limit(100);
  const rows = (data as CustomRequest[]) ?? [];
  const thumbs = await signThumbs(rows);

  return (
    <>
      <PageHeader title="Custom Art Requests" subtitle={`${rows.length} request${rows.length === 1 ? "" : "s"}`} />
      <AdminFilters statuses={STATUS_OPTIONS} searchPlaceholder="Request no, name or phone…" />

      {rows.length === 0 ? (
        <EmptyState title="No custom requests yet" hint="New String Face Art orders will land here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <Link
              key={r.id}
              href={`/admin/custom-requests/${r.id}`}
              className="card group overflow-hidden transition hover:shadow-card"
            >
              <div className="relative aspect-square bg-cream-200">
                {thumbs[r.id] ? (
                  <Image
                    src={thumbs[r.id]}
                    alt={`Custom request ${r.request_no}`}
                    fill
                    sizes="(max-width:640px) 100vw, 33vw"
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-charcoal-300">
                    No photo
                  </div>
                )}
                <div className="absolute left-2 top-2">
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-charcoal-800 group-hover:text-terracotta-600">
                    {r.request_no}
                  </span>
                  <span className="text-sm font-medium">{formatNPR(r.price)}</span>
                </div>
                <p className="mt-0.5 text-sm text-charcoal-600">{r.full_name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-charcoal-400">{formatDate(r.created_at)}</span>
                  <PaymentBadge status={r.payment_status} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
