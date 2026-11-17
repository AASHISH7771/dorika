import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MessageCircle, Phone } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { StatusBadge, PaymentBadge } from "@/components/admin/ui";
import { formatNPR, formatDateTime, formatDate, statusLabel, normalizePhone } from "@/lib/utils";
import type { CustomRequest, CustomStatus } from "@/lib/types";
import {
  updateCustomStatus,
  updateCustomPrice,
  updateCustomNotes,
  updateCustomPayment,
} from "../actions";

export const dynamic = "force-dynamic";

const STATUSES = ["pending", "confirmed", "in_progress", "shipped", "delivered", "cancelled"] as const;
const PAYMENTS = ["unpaid", "pending", "paid", "refunded", "failed"] as const;

async function getPhotoUrls(path: string | null) {
  if (!path) return { view: null as string | null, download: null as string | null };
  try {
    const admin = createAdminClient();
    const [view, dl] = await Promise.all([
      admin.storage.from("custom-photos").createSignedUrl(path, 60 * 60),
      admin.storage.from("custom-photos").createSignedUrl(path, 60 * 5, { download: true }),
    ]);
    return { view: view.data?.signedUrl ?? null, download: dl.data?.signedUrl ?? null };
  } catch {
    return { view: null, download: null };
  }
}

export default async function CustomRequestDetail({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data } = await supabase
    .from("custom_requests")
    .select("*, custom_events(status, note, created_at)")
    .eq("id", params.id)
    .single();

  const req = data as (CustomRequest & { custom_events?: { status: CustomStatus; note: string | null; created_at: string }[] }) | null;
  if (!req) notFound();

  const photo = await getPhotoUrls(req.photo_path);
  const events = [...(req.custom_events ?? [])].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const waPhone = normalizePhone(req.whatsapp || req.phone).replace(/^977/, "");
  const waUrl = `https://wa.me/977${waPhone}?text=${encodeURIComponent(
    `Hi ${req.full_name}, this is Dorika about your custom art request ${req.request_no}.`
  )}`;

  const detailRows: [string, string | null][] = [
    ["Phone", req.phone],
    ["WhatsApp", req.whatsapp],
    ["Alt. phone", req.alt_phone],
    ["Email", req.email],
    ["District", req.district],
    ["Municipality", req.municipality],
    ["Ward / Tole", req.ward_tole],
    ["Full address", req.full_address],
    ["Landmark", req.landmark],
    ["Preferred date", req.preferred_date ? formatDate(req.preferred_date) : null],
    ["Gift or self", req.gift_or_self],
    ["Background", req.background_pref],
    ["Plank size", req.plank_size],
  ];

  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/custom-requests" className="btn-ghost btn-sm">
          <ArrowLeft className="h-4 w-4" /> Custom requests
        </Link>
        <a href={waUrl} target="_blank" className="btn-outline btn-sm">
          <MessageCircle className="h-4 w-4" /> Confirm on WhatsApp
        </a>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">{req.request_no}</h1>
        <StatusBadge status={req.status} />
        <PaymentBadge status={req.payment_status} />
        <span className="text-sm text-charcoal-400">{formatDateTime(req.created_at)}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Photo + details */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="relative aspect-square max-h-[460px] bg-cream-200">
              {photo.view ? (
                <Image src={photo.view} alt="Customer photo" fill className="object-contain" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-charcoal-300">
                  Photo unavailable (service role key not configured)
                </div>
              )}
            </div>
            {photo.download && (
              <div className="border-t border-charcoal-100 p-3">
                <a href={photo.download} className="btn-outline btn-sm w-full">
                  <Download className="h-4 w-4" /> Download photo
                </a>
              </div>
            )}
          </div>

          <div className="card p-5">
            <h2 className="mb-3 font-extrabold">Request details</h2>
            <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-charcoal-400">Name</dt>
                <dd className="text-charcoal-700">{req.full_name}</dd>
              </div>
              {detailRows
                .filter(([, v]) => v)
                .map(([label, v]) => (
                  <div key={label} className={label === "Full address" ? "sm:col-span-2" : ""}>
                    <dt className="text-xs uppercase tracking-wide text-charcoal-400">{label}</dt>
                    <dd className="text-charcoal-700">
                      {label === "Phone" ? (
                        <a href={`tel:${v}`} className="inline-flex items-center gap-1 text-terracotta-600 hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {v}
                        </a>
                      ) : (
                        v
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            {req.special_instructions && (
              <div className="mt-4 rounded-xl bg-cream-200 p-4 text-sm">
                <p className="mb-1 text-xs font-bold uppercase tracking-wide text-charcoal-400">
                  Special instructions
                </p>
                <p className="text-charcoal-700">{req.special_instructions}</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-3 font-extrabold">Update status</h2>
            <form action={updateCustomStatus} className="space-y-3">
              <input type="hidden" name="id" value={req.id} />
              <select name="status" defaultValue={req.status} className="input text-sm">
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
              <textarea
                name="note"
                placeholder="Optional note (shown on /track)"
                className="input min-h-[70px] resize-y text-sm"
              />
              <button type="submit" className="btn-primary btn-sm w-full">
                Save status
              </button>
            </form>
          </div>

          <div className="card space-y-5 p-5">
            <form action={updateCustomPrice} className="space-y-2">
              <input type="hidden" name="id" value={req.id} />
              <label className="label">Price (Rs.)</label>
              <input
                type="number"
                name="price"
                defaultValue={req.price}
                min={0}
                step={100}
                className="input text-sm"
              />
              <button type="submit" className="btn-dark btn-sm w-full">
                Save price
              </button>
            </form>

            <form action={updateCustomPayment} className="space-y-2 border-t border-charcoal-100 pt-5">
              <input type="hidden" name="id" value={req.id} />
              <label className="label">Payment status</label>
              <select name="payment_status" defaultValue={req.payment_status} className="input text-sm">
                {PAYMENTS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-dark btn-sm w-full">
                Save payment
              </button>
            </form>
          </div>

          <div className="card p-5">
            <form action={updateCustomNotes} className="space-y-2">
              <input type="hidden" name="id" value={req.id} />
              <label className="label">Internal notes</label>
              <textarea
                name="admin_notes"
                defaultValue={req.admin_notes ?? ""}
                placeholder="Private — only you see this"
                className="input min-h-[90px] resize-y text-sm"
              />
              <button type="submit" className="btn-outline btn-sm w-full">
                Save notes
              </button>
            </form>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-extrabold">Timeline</h2>
            {events.length === 0 ? (
              <p className="text-sm text-charcoal-400">No events yet.</p>
            ) : (
              <ol className="space-y-4">
                {events.map((e, i) => (
                  <li key={i} className="relative pl-6">
                    <span className="absolute left-0 top-1 h-3 w-3 rounded-full bg-terracotta-500" />
                    {i < events.length - 1 && (
                      <span className="absolute left-[5px] top-4 h-full w-px bg-charcoal-100" />
                    )}
                    <p className="text-sm font-semibold">{statusLabel[e.status]}</p>
                    {e.note && <p className="text-xs text-charcoal-500">{e.note}</p>}
                    <p className="text-xs text-charcoal-400">{formatDateTime(e.created_at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
