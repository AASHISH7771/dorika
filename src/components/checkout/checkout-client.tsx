"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Truck, Banknote, Wallet, Landmark, QrCode } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Turnstile } from "@/components/turnstile";
import { HONEYPOT_FIELD } from "@/lib/security";
import { displayImage } from "@/lib/config";
import { formatNPR, cn, isValidNepaliPhone } from "@/lib/utils";
import type { PaymentMethod, Settings } from "@/lib/types";

export function CheckoutClient({ settings }: { settings: Settings | null }) {
  const router = useRouter();
  const { items, subtotal, clear } = useCart();

  const [form, setForm] = useState({
    customer_name: "", phone: "", email: "", district: "", city: "",
    address: "", landmark: "", notes: "",
  });
  const [payment, setPayment] = useState<PaymentMethod>("cod");
  const [reference, setReference] = useState("");
  const [token, setToken] = useState("");
  const [hp, setHp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee =
    settings && subtotal >= Number(settings.free_delivery_over)
      ? 0
      : Number(settings?.delivery_fee ?? 150);
  const total = subtotal + deliveryFee;

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const methods: { id: PaymentMethod; label: string; desc: string; icon: typeof Truck; enabled: boolean }[] = [
    { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Banknote, enabled: settings?.cod_enabled ?? true },
    { id: "esewa", label: "eSewa", desc: "Pay via eSewa wallet", icon: Wallet, enabled: settings?.esewa_enabled ?? false },
    { id: "khalti", label: "Khalti", desc: "Pay via Khalti wallet", icon: Wallet, enabled: settings?.khalti_enabled ?? false },
    { id: "bank_transfer", label: "Bank Transfer / QR", desc: "Transfer to our bank or scan QR", icon: Landmark, enabled: settings?.bank_enabled ?? true },
  ];
  const activeMethods = methods.filter((m) => m.enabled);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.customer_name.trim() || !isValidNepaliPhone(form.phone)) {
      setError("Please enter your name and a valid phone number.");
      return;
    }
    if (!form.district.trim() || !form.address.trim()) {
      setError("Please enter your delivery district and address.");
      return;
    }
    if (payment !== "cod" && !reference.trim()) {
      setError("Please paste the transaction ID from your payment so we can confirm the order.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          payment_method: payment,
          payment_reference: reference.trim() || null,
          items,
          turnstileToken: token,
          [HONEYPOT_FIELD]: hp,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      clear();
      router.push(`/order-confirmation?order=${data.order_no}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white py-20 text-center">
        <p className="text-charcoal-500">Your cart is empty.</p>
        <a href="/shop" className="btn-primary btn-lg mt-6">Browse products</a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-8 lg:grid-cols-[1fr_380px]">
      {/* Honeypot */}
      <input type="text" tabIndex={-1} autoComplete="off" className="hp-field"
        data-lpignore="true" data-1p-ignore="true" data-form-type="other"
        aria-hidden="true" name={HONEYPOT_FIELD} value={hp} onChange={(e) => setHp(e.target.value)} />

      <div className="space-y-8">
        {/* Delivery details */}
        <section className="rounded-2xl border border-charcoal-100 bg-white p-6">
          <h2 className="text-lg font-bold">Delivery details</h2>
          <p className="mt-1 text-sm text-charcoal-400">No account needed — just tell us where to deliver.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" required>
              <Input value={form.customer_name} onChange={(e) => set("customer_name", e.target.value)} placeholder="Your name" />
            </Field>
            <Field label="Phone" required hint="We'll call to confirm">
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" />
            </Field>
            <Field label="Email" hint="Optional — for confirmation" className="sm:col-span-2">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="District" required>
              <Input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Tanahun" />
            </Field>
            <Field label="City / Municipality">
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Byas" />
            </Field>
            <Field label="Full delivery address" required className="sm:col-span-2">
              <Textarea value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="House / street / area" />
            </Field>
            <Field label="Nearest landmark">
              <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="Helps the courier find you" />
            </Field>
            <Field label="Order notes">
              <Input value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything else?" />
            </Field>
          </div>
        </section>

        {/* Payment */}
        <section className="rounded-2xl border border-charcoal-100 bg-white p-6">
          <h2 className="text-lg font-bold">Payment method</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {activeMethods.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => setPayment(m.id)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border-2 p-4 text-left transition",
                  payment === m.id ? "border-terracotta-500 bg-terracotta-50" : "border-charcoal-100 hover:border-terracotta-300"
                )}
              >
                <m.icon className={cn("h-6 w-6", payment === m.id ? "text-terracotta-600" : "text-charcoal-400")} />
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="text-xs text-charcoal-400">{m.desc}</span>
                </span>
              </button>
            ))}
          </div>

          {payment !== "cod" && (
            <div className="mt-4 rounded-xl bg-cream-200 p-4 text-sm">
              <p className="font-semibold text-charcoal-800">
                {payment === "bank_transfer"
                  ? "Pay by bank transfer or QR"
                  : `Pay with ${payment === "esewa" ? "eSewa" : "Khalti"}`}
              </p>

              {payment === "esewa" && (
                <p className="mt-1 text-charcoal-500">
                  Send <strong>{formatNPR(total)}</strong> to eSewa{" "}
                  <span className="font-mono font-semibold text-charcoal-800">
                    {settings?.esewa_id || "— add your eSewa number in admin settings —"}
                  </span>
                </p>
              )}
              {payment === "khalti" && (
                <p className="mt-1 text-charcoal-500">
                  Send <strong>{formatNPR(total)}</strong> to Khalti{" "}
                  <span className="font-mono font-semibold text-charcoal-800">
                    {settings?.khalti_id || "— add your Khalti number in admin settings —"}
                  </span>
                </p>
              )}
              {payment === "bank_transfer" && (
                <div className="mt-1 space-y-1 text-charcoal-500">
                  <p>
                    Transfer <strong>{formatNPR(total)}</strong> to:
                  </p>
                  <p className="font-mono font-semibold text-charcoal-800">
                    {settings?.bank_name || "—"}
                    {settings?.bank_account_number
                      ? ` · ${settings.bank_account_number}`
                      : " · add account in admin settings"}
                  </p>
                  {settings?.bank_account_name && <p>{settings.bank_account_name}</p>}
                  {settings?.bank_qr_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={settings.bank_qr_url}
                      alt="Bank QR code"
                      className="mt-2 h-40 w-40 rounded-lg bg-white object-contain p-2"
                    />
                  )}
                </div>
              )}

              {settings?.payment_note && (
                <p className="mt-2 text-xs text-charcoal-400">{settings.payment_note}</p>
              )}

              <div className="mt-3">
                <Field label="Transaction ID" htmlFor="payment_reference" hint="Paste the id from your payment receipt">
                  <Input
                    id="payment_reference"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. 8H4K2L9M"
                  />
                </Field>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Summary */}
      <aside className="h-fit rounded-2xl border border-charcoal-100 bg-white p-6 lg:sticky lg:top-24">
        <h2 className="text-lg font-bold">Your order</h2>
        <div className="mt-4 max-h-64 space-y-3 overflow-y-auto">
          {items.map((i) => (
            <div key={i.productId} className="flex gap-3">
              <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-cream-200">
                <Image src={displayImage(i.image)} alt={i.name} fill sizes="56px" className="object-cover" />
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-charcoal-800 px-1 text-[11px] font-bold text-white">
                  {i.quantity}
                </span>
              </div>
              <div className="flex flex-1 items-center justify-between gap-2">
                <span className="line-clamp-2 text-sm">{i.name}</span>
                <span className="text-sm font-semibold">{formatNPR(i.price * i.quantity)}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 space-y-2 border-t border-charcoal-100 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-charcoal-500">Subtotal</span><span className="font-semibold">{formatNPR(subtotal)}</span></div>
          <div className="flex justify-between">
            <span className="text-charcoal-500">Delivery</span>
            <span className="font-semibold">{deliveryFee === 0 ? "Free" : formatNPR(deliveryFee)}</span>
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-charcoal-100 pt-3 text-lg">
          <span className="font-bold">Total</span>
          <span className="font-extrabold text-terracotta-600">{formatNPR(total)}</span>
        </div>

        <div className="mt-4">
          <Turnstile onToken={setToken} />
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}

        <button type="submit" disabled={submitting || !token} className="btn-primary btn-lg mt-4 w-full">
          {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Placing order…</> : `Place order · ${formatNPR(total)}`}
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-charcoal-400">
          <Truck className="h-3.5 w-3.5" /> Delivered across Nepal
        </p>
      </aside>
    </form>
  );
}
