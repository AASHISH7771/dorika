import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  rateLimit, getClientIp, isHoneypotTripped, verifyTurnstile, HONEYPOT_FIELD,
} from "@/lib/security";
import { generateRequestNo, isValidNepaliPhone } from "@/lib/utils";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";
import { siteConfig } from "@/lib/config";

export const runtime = "nodejs";

// Accepts multipart/form-data: the face photo + all the detail fields.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`custom:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid submission." }, { status: 400 });
  }

  const get = (k: string) => (form.get(k)?.toString() ?? "").trim();

  // Honeypot
  if (isHoneypotTripped(get(HONEYPOT_FIELD))) {
    return NextResponse.json({ request_no: generateRequestNo(), ok: true });
  }
  if (!(await verifyTurnstile(get("turnstileToken") || undefined, ip))) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  // Validate required fields
  const full_name = get("full_name");
  const phone = get("phone");
  if (!full_name || !isValidNepaliPhone(phone)) {
    return NextResponse.json({ error: "Please provide a valid name and phone number." }, { status: 400 });
  }

  const photo = form.get("photo");
  if (!(photo instanceof File) || photo.size === 0) {
    return NextResponse.json({ error: "Please upload a face photo." }, { status: 400 });
  }
  // Server-side guard: type + size (max ~10MB)
  const okType = ["image/jpeg", "image/png", "image/webp"].includes(photo.type);
  if (!okType) {
    return NextResponse.json({ error: "Photo must be JPG, PNG or WEBP." }, { status: 400 });
  }
  if (photo.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo is too large (max 10MB)." }, { status: 400 });
  }

  const admin = createAdminClient();
  const request_no = generateRequestNo();

  // Upload photo to the PRIVATE bucket (admin-only, signed URLs for viewing)
  const ext = photo.type === "image/png" ? "png" : photo.type === "image/webp" ? "webp" : "jpg";
  const photoPath = `${request_no}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await photo.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from("custom-photos")
    .upload(photoPath, buffer, { contentType: photo.type, upsert: false });
  if (upErr) {
    console.error("[custom-requests] photo upload failed:", upErr);
    return NextResponse.json({ error: "Could not upload photo. Please try again." }, { status: 500 });
  }

  // Price from settings
  const { data: settings } = await admin.from("settings").select("custom_art_price").eq("id", 1).single();
  const price = Number(settings?.custom_art_price ?? siteConfig.customArt.price);

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const preferred = get("preferred_date");
  const { data: request, error: insErr } = await admin
    .from("custom_requests")
    .insert({
      request_no,
      user_id: user?.id ?? null,
      photo_path: photoPath,
      full_name,
      phone,
      whatsapp: get("whatsapp") || null,
      email: get("email") || null,
      district: get("district") || null,
      municipality: get("municipality") || null,
      ward_tole: get("ward_tole") || null,
      full_address: get("full_address") || null,
      landmark: get("landmark") || null,
      alt_phone: get("alt_phone") || null,
      preferred_date: preferred || null,
      gift_or_self: get("gift_or_self") || null,
      background_pref: get("background_pref") || null,
      special_instructions: get("special_instructions") || null,
      plank_size: siteConfig.customArt.plankSize,
      price,
      status: "pending",
    })
    .select()
    .single();

  if (insErr || !request) {
    console.error("[custom-requests] insert failed:", insErr);
    // best-effort cleanup
    await admin.storage.from("custom-photos").remove([photoPath]);
    return NextResponse.json({ error: "Could not submit request. Please try again." }, { status: 500 });
  }

  await admin.from("custom_events").insert({
    request_id: request.id,
    status: "pending",
    note: "Custom art request received.",
  });

  const email = get("email");
  if (email) {
    await sendEmail({
      to: email,
      subject: `Dorika: custom art request ${request_no} received`,
      html: orderConfirmationHtml({
        orderNo: request_no,
        name: full_name,
        amount: price,
        trackUrl: `${siteConfig.url}/track?order=${request_no}`,
        kind: "custom",
      }),
    });
  }

  return NextResponse.json({ request_no, price, ok: true });
}
