import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  rateLimit, getClientIp, isHoneypotTripped, verifyTurnstile, HONEYPOT_FIELD,
} from "@/lib/security";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`contact:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many messages. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (isHoneypotTripped(body[HONEYPOT_FIELD])) {
    return NextResponse.json({ ok: true });
  }
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const message = (body.message ?? "").trim();
  if (!name || !message) {
    return NextResponse.json({ error: "Name and message are required." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("contact_messages").insert({
    name,
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    subject: body.subject?.trim() || null,
    message,
  });

  if (error) {
    return NextResponse.json({ error: "Could not send message. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
