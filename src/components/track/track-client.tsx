"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Loader2, Package, Check } from "lucide-react";
import { Field, Input } from "@/components/ui/input";
import { formatNPR, formatDateTime, statusLabel, statusColor, STATUS_FLOW, cn } from "@/lib/utils";
import type { TrackResult, OrderStatus } from "@/lib/types";

function TrackInner() {
  const params = useSearchParams();
  const [orderNo, setOrderNo] = useState(params.get("order") ?? "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TrackResult | null>(null);

  // If an order id is in the URL, pre-fill it (phone still required)
  useEffect(() => {
    const o = params.get("order");
    if (o) setOrderNo(o);
  }, [params]);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (!orderNo.trim() || !phone.trim()) {
      setError("Please enter both your Order ID and phone number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_no: orderNo.trim(), phone: phone.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Lookup failed.");
      setResult(data.result as TrackResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const cancelled = result?.status === "cancelled";
  const currentIdx = result ? STATUS_FLOW.indexOf(result.status) : -1;

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={lookup} className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-soft sm:p-8">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Order ID" required>
            <Input value={orderNo} onChange={(e) => setOrderNo(e.target.value)} placeholder="DRK-XXXXXX" />
          </Field>
          <Field label="Phone number" required>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" />
          </Field>
        </div>
        {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary btn-lg mt-5 w-full">
          {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Searching…</> : <><Search className="h-5 w-5" /> Track order</>}
        </button>
      </form>

      {result && (
        <div className="mt-6 rounded-2xl border border-charcoal-100 bg-white p-6 shadow-soft sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal-100 pb-5">
            <div>
              <p className="text-sm text-charcoal-400">
                {result.type === "custom" ? "Custom Art Request" : "Order"}
              </p>
              <p className="text-xl font-extrabold">{result.order_no}</p>
              <p className="text-sm text-charcoal-400">Placed {formatDateTime(result.created_at)}</p>
            </div>
            <span className={cn("badge !px-3 !py-1 text-sm", statusColor[result.status])}>
              {statusLabel[result.status]}
            </span>
          </div>

          <div className="flex items-center justify-between py-5 text-sm">
            <span className="text-charcoal-500">Customer</span>
            <span className="font-semibold">{result.customer_name}</span>
          </div>
          <div className="flex items-center justify-between border-t border-charcoal-100 py-5 text-sm">
            <span className="text-charcoal-500">{result.type === "custom" ? "Price" : "Total"}</span>
            <span className="font-extrabold text-terracotta-600">
              {formatNPR((result.total ?? result.price ?? 0) as number)}
            </span>
          </div>

          {/* Timeline */}
          <div className="mt-2 border-t border-charcoal-100 pt-6">
            <h3 className="mb-5 font-bold">Status timeline</h3>
            {cancelled ? (
              <div className="rounded-xl bg-red-50 p-4 text-red-700">
                This order was cancelled. Contact us on WhatsApp if you think this is a mistake.
              </div>
            ) : (
              <ol className="relative ml-3 border-l-2 border-charcoal-100">
                {STATUS_FLOW.map((s, i) => {
                  const done = i <= currentIdx;
                  const current = i === currentIdx;
                  const evt = result.events.find((e) => e.status === s);
                  return (
                    <li key={s} className="mb-6 ml-6 last:mb-0">
                      <span className={cn(
                        "absolute -left-[13px] flex h-6 w-6 items-center justify-center rounded-full border-2",
                        done ? "border-terracotta-500 bg-terracotta-500 text-white" : "border-charcoal-200 bg-white"
                      )}>
                        {done ? <Check className="h-3.5 w-3.5" /> : <span className="h-2 w-2 rounded-full bg-charcoal-200" />}
                      </span>
                      <p className={cn("font-semibold", current ? "text-terracotta-600" : done ? "text-charcoal-800" : "text-charcoal-300")}>
                        {statusLabel[s as OrderStatus]}
                      </p>
                      {evt && (
                        <p className="text-xs text-charcoal-400">
                          {formatDateTime(evt.created_at)}{evt.note ? ` · ${evt.note}` : ""}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function TrackClient() {
  return (
    <Suspense fallback={<div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-terracotta-500" /></div>}>
      <TrackInner />
    </Suspense>
  );
}
