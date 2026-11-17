"use client";

import { useState } from "react";
import { Loader2, Check, Send } from "lucide-react";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Turnstile } from "@/components/turnstile";
import { HONEYPOT_FIELD } from "@/lib/security";

export function ContactForm() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [token, setToken] = useState("");
  const [hp, setHp] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.message.trim()) {
      setError("Please enter your name and a message.");
      return;
    }
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, turnstileToken: token, [HONEYPOT_FIELD]: hp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send.");
      setStatus("sent");
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStatus("idle");
    }
  };

  if (status === "sent") {
    return (
      <div className="rounded-2xl border border-charcoal-100 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
          <Check className="h-7 w-7 text-green-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold">Message sent!</h3>
        <p className="mt-1 text-charcoal-500">Thank you — we&apos;ll get back to you soon.</p>
        <button onClick={() => setStatus("idle")} className="btn-outline btn-md mt-5">
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-charcoal-100 bg-white p-6 shadow-soft sm:p-8">
      <input type="text" tabIndex={-1} autoComplete="off" className="hp-field"
        data-lpignore="true" data-1p-ignore="true" data-form-type="other"
        aria-hidden="true" name={HONEYPOT_FIELD} value={hp} onChange={(e) => setHp(e.target.value)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" required>
          <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Your name" />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="98XXXXXXXX" inputMode="tel" />
        </Field>
        <Field label="Email">
          <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" />
        </Field>
        <Field label="Subject">
          <Input value={form.subject} onChange={(e) => set("subject", e.target.value)} placeholder="How can we help?" />
        </Field>
      </div>
      <Field label="Message" required className="mt-4">
        <Textarea value={form.message} onChange={(e) => set("message", e.target.value)} placeholder="Tell us what you need…" className="min-h-[140px]" />
      </Field>

      <div className="mt-4">
        <Turnstile onToken={setToken} />
      </div>

      {error && <p className="mt-4 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700">{error}</p>}

      <button type="submit" disabled={status === "sending"} className="btn-primary btn-lg mt-5 w-full sm:w-auto">
        {status === "sending" ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : <><Send className="h-5 w-5" /> Send message</>}
      </button>
    </form>
  );
}
