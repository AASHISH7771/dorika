"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import imageCompression from "browser-image-compression";
import {
  Upload, Camera, Check, ChevronLeft, ChevronRight, Loader2, X, Image as ImageIcon,
} from "lucide-react";
import { Field, Input, Textarea, Select } from "@/components/ui/input";
import { Turnstile } from "@/components/turnstile";
import { HONEYPOT_FIELD } from "@/lib/security";
import { formatNPR, cn, isValidNepaliPhone } from "@/lib/utils";
import { siteConfig } from "@/lib/config";

const DRAFT_KEY = "dorika_custom_draft_v1";
const STEPS = ["Photo", "Details", "Review", "Done"] as const;

interface FormState {
  full_name: string; phone: string; whatsapp: string; sameWhatsapp: boolean;
  email: string; district: string; municipality: string; ward_tole: string;
  full_address: string; landmark: string;
  alt_phone: string; preferred_date: string; gift_or_self: string;
  background_pref: string; special_instructions: string;
}

const emptyForm: FormState = {
  full_name: "", phone: "", whatsapp: "", sameWhatsapp: true, email: "",
  district: "", municipality: "", ward_tole: "", full_address: "", landmark: "",
  alt_phone: "", preferred_date: "", gift_or_self: "", background_pref: "", special_instructions: "",
};

export function CustomArtBuilder({ price, makingTime }: { price: number; makingTime: string }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ request_no: string } | null>(null);
  const [token, setToken] = useState("");
  const [hp, setHp] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // Restore draft (text fields only — files can't persist)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setForm({ ...emptyForm, ...JSON.parse(raw) });
    } catch {/* ignore */}
  }, []);
  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(form)); } catch {/* ignore */}
  }, [form]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please upload a JPG, PNG or WEBP image.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Max size is 10MB.");
      return;
    }
    setCompressing(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: file.type === "image/png" ? "image/png" : "image/jpeg",
      });
      setPhotoFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      // Fallback to original if compression fails
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    } finally {
      setCompressing(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  // Step validation
  const canNext = () => {
    if (step === 0) return !!photoFile;
    if (step === 1)
      return (
        form.full_name.trim() &&
        isValidNepaliPhone(form.phone) &&
        form.district.trim() &&
        form.full_address.trim()
      );
    return true;
  };

  const next = () => {
    if (!canNext()) {
      setError("Please complete the required fields before continuing.");
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => { setError(null); setStep((s) => Math.max(s - 1, 0)); };

  const submit = async () => {
    if (!photoFile) { setStep(0); return; }
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("photo", photoFile);
      const whatsapp = form.sameWhatsapp ? form.phone : form.whatsapp;
      Object.entries({ ...form, whatsapp }).forEach(([k, v]) => {
        if (k === "sameWhatsapp") return;
        fd.append(k, String(v ?? ""));
      });
      fd.append("turnstileToken", token);
      fd.append(HONEYPOT_FIELD, hp);

      const res = await fetch("/api/custom-requests", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");
      setResult({ request_no: data.request_no });
      setStep(STEPS.length - 1);
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Confirmation screen ──────────────────────────────────────
  if (result) {
    const waMsg = `Hi Dorika, I just submitted my String Face Art request. My Order ID is ${result.request_no}.`;
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-charcoal-100 bg-white p-8 text-center shadow-card">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="mt-5 text-2xl font-extrabold">Request received!</h2>
        <p className="mt-2 text-charcoal-500">
          Thank you! We&apos;ll review your photo and get in touch shortly.
        </p>
        <div className="mt-6 rounded-xl bg-cream-200 p-5">
          <p className="text-sm text-charcoal-400">Your Order ID</p>
          <p className="text-2xl font-extrabold tracking-wide text-terracotta-600">
            {result.request_no}
          </p>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${siteConfig.contact.whatsapp}?text=${encodeURIComponent(waMsg)}`}
            target="_blank" rel="noopener noreferrer"
            className="btn-primary btn-lg flex-1 !bg-whatsapp hover:!brightness-110"
          >
            Confirm on WhatsApp
          </a>
          <a href={`/track?order=${result.request_no}`} className="btn-outline btn-lg flex-1">
            Track your order
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Progress indicator */}
      <ol className="mb-8 flex items-center">
        {STEPS.slice(0, 3).map((label, i) => (
          <li key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center">
              <div className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition",
                i < step ? "border-terracotta-500 bg-terracotta-500 text-white"
                  : i === step ? "border-terracotta-500 text-terracotta-600"
                  : "border-charcoal-200 text-charcoal-300"
              )}>
                {i < step ? <Check className="h-5 w-5" /> : i + 1}
              </div>
              <span className={cn("mt-1.5 text-xs font-semibold", i <= step ? "text-charcoal-700" : "text-charcoal-300")}>
                {label}
              </span>
            </div>
            {i < 2 && (
              <div className={cn("mx-2 h-0.5 flex-1 rounded", i < step ? "bg-terracotta-500" : "bg-charcoal-100")} />
            )}
          </li>
        ))}
      </ol>

      <div className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-soft sm:p-8">
        {/* Honeypot */}
        <input
          type="text" tabIndex={-1} autoComplete="off"
          data-lpignore="true" data-1p-ignore="true" data-form-type="other"
          className="hp-field" aria-hidden="true"
          name={HONEYPOT_FIELD} value={hp} onChange={(e) => setHp(e.target.value)}
        />

        {/* STEP 0: Photo */}
        {step === 0 && (
          <div>
            <h2 className="text-xl font-bold">Upload your face photo</h2>
            <p className="mt-1 text-sm text-charcoal-400">
              A clear, well-lit photo of the face works best. JPG, PNG or WEBP, up to 10MB.
            </p>

            {!preview ? (
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition",
                  dragOver ? "border-terracotta-500 bg-terracotta-50" : "border-charcoal-200 hover:border-terracotta-300 hover:bg-cream-100"
                )}
              >
                {compressing ? (
                  <>
                    <Loader2 className="h-10 w-10 animate-spin text-terracotta-500" />
                    <p className="mt-3 font-semibold">Optimising your photo…</p>
                  </>
                ) : (
                  <>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-terracotta-50 text-terracotta-600">
                      <ImageIcon className="h-7 w-7" />
                    </div>
                    <p className="mt-3 font-semibold">Drag &amp; drop your photo here</p>
                    <p className="text-sm text-charcoal-400">or tap to browse / use camera</p>
                    <div className="mt-4 flex gap-2">
                      <span className="btn-outline btn-sm pointer-events-none"><Upload className="h-4 w-4" /> Browse</span>
                      <span className="btn-outline btn-sm pointer-events-none"><Camera className="h-4 w-4" /> Camera</span>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="relative mt-5">
                <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl bg-cream-200">
                  <Image src={preview} alt="Your photo preview" fill className="object-cover" sizes="400px" />
                </div>
                <button
                  onClick={() => { setPhotoFile(null); setPreview(null); }}
                  className="btn-outline btn-sm mx-auto mt-4 flex"
                >
                  <X className="h-4 w-4" /> Choose a different photo
                </button>
              </div>
            )}

            <input
              ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp"
              capture="environment" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </div>
        )}

        {/* STEP 1: Details */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-xl font-bold">Your details</h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} placeholder="Your full name" />
              </Field>
              <Field label="Phone" required hint="Nepali mobile number">
                <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" />
              </Field>
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <input type="checkbox" checked={form.sameWhatsapp}
                  onChange={(e) => set("sameWhatsapp", e.target.checked)}
                  className="h-4 w-4 rounded border-charcoal-300 text-terracotta-500" />
                WhatsApp number same as phone
              </label>
              {!form.sameWhatsapp && (
                <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="WhatsApp number" inputMode="tel" />
              )}
            </div>

            <Field label="Email" hint="For your confirmation (optional)">
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="District" required>
                <Input value={form.district} onChange={(e) => set("district", e.target.value)} placeholder="e.g. Kaski" />
              </Field>
              <Field label="Municipality / City">
                <Input value={form.municipality} onChange={(e) => set("municipality", e.target.value)} placeholder="e.g. Byas" />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ward / Tole">
                <Input value={form.ward_tole} onChange={(e) => set("ward_tole", e.target.value)} placeholder="Ward no. / tole" />
              </Field>
              <Field label="Nearest landmark">
                <Input value={form.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. near Lakeside" />
              </Field>
            </div>

            <Field label="Full delivery address" required>
              <Textarea value={form.full_address} onChange={(e) => set("full_address", e.target.value)} placeholder="House / street / area details" />
            </Field>

            <details className="rounded-xl border border-charcoal-100 p-4">
              <summary className="cursor-pointer font-semibold text-charcoal-700">Optional details</summary>
              <div className="mt-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Alternate contact number">
                    <Input value={form.alt_phone} onChange={(e) => set("alt_phone", e.target.value)} placeholder="Another number" inputMode="tel" />
                  </Field>
                  <Field label="Preferred delivery date">
                    <Input type="date" value={form.preferred_date} onChange={(e) => set("preferred_date", e.target.value)} />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gift or self">
                    <Select value={form.gift_or_self} onChange={(e) => set("gift_or_self", e.target.value)}>
                      <option value="">Select…</option>
                      <option value="self">For myself</option>
                      <option value="gift">It&apos;s a gift</option>
                    </Select>
                  </Field>
                  <Field label="Background / frame preference">
                    <Input value={form.background_pref} onChange={(e) => set("background_pref", e.target.value)} placeholder="e.g. natural wood, black frame" />
                  </Field>
                </div>
                <Field label="Special instructions">
                  <Textarea value={form.special_instructions} onChange={(e) => set("special_instructions", e.target.value)} placeholder="Anything we should know?" />
                </Field>
              </div>
            </details>
          </div>
        )}

        {/* STEP 2: Review */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold">Review &amp; submit</h2>
            <div className="mt-5 grid gap-6 sm:grid-cols-2">
              {preview && (
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-cream-200">
                  <Image src={preview} alt="Your photo" fill className="object-cover" sizes="300px" />
                </div>
              )}
              <dl className="space-y-2 text-sm">
                <Row k="Name" v={form.full_name} />
                <Row k="Phone" v={form.phone} />
                <Row k="WhatsApp" v={form.sameWhatsapp ? form.phone : form.whatsapp} />
                {form.email && <Row k="Email" v={form.email} />}
                <Row k="District" v={form.district} />
                {form.municipality && <Row k="City" v={form.municipality} />}
                <Row k="Address" v={form.full_address} />
                {form.landmark && <Row k="Landmark" v={form.landmark} />}
              </dl>
            </div>

            <div className="mt-6 rounded-xl bg-cream-200 p-4 text-sm">
              <div className="flex justify-between"><span className="text-charcoal-500">Plank</span><span className="font-semibold">{siteConfig.customArt.plankSize}</span></div>
              <div className="flex justify-between"><span className="text-charcoal-500">Making time</span><span className="font-semibold">{makingTime}</span></div>
              <div className="mt-2 flex justify-between border-t border-charcoal-200 pt-2 text-base">
                <span className="font-semibold">Price</span>
                <span className="font-extrabold text-terracotta-600">{formatNPR(price)}</span>
              </div>
            </div>

            <div className="mt-5">
              <Turnstile onToken={setToken} />
            </div>
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>
        )}

        {/* Nav buttons */}
        <div className="mt-8 flex items-center justify-between gap-3">
          {step > 0 ? (
            <button onClick={back} className="btn-ghost btn-md">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : <span />}

          {step < 2 ? (
            <button onClick={next} className="btn-primary btn-lg">
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={submit} disabled={submitting || !token} className="btn-primary btn-lg">
              {submitting ? <><Loader2 className="h-5 w-5 animate-spin" /> Submitting…</> : "Submit request"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-24 flex-shrink-0 text-charcoal-400">{k}</dt>
      <dd className="font-medium text-charcoal-700">{v || "Not provided"}</dd>
    </div>
  );
}
