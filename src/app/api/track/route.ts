import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimit, getClientIp } from "@/lib/security";

export const runtime = "nodejs";

// Public order/custom-request tracking. Looks up by reference + phone via
// SECURITY DEFINER RPCs so no broad table access is exposed.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`track:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many lookups. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { order_no?: string; phone?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderNo = (body.order_no ?? "").trim();
  const phone = (body.phone ?? "").trim();
  if (!orderNo || !phone) {
    return NextResponse.json({ error: "Enter your Order ID and phone number." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Custom requests use the DRK-C- prefix
  const isCustom = /^DRK-C-/i.test(orderNo);
  const rpc = isCustom ? "track_custom" : "track_order";
  const arg = isCustom
    ? { p_request_no: orderNo, p_phone: phone }
    : { p_order_no: orderNo, p_phone: phone };

  const { data, error } = await admin.rpc(rpc, arg);

  if (error) {
    console.error(`[track] rpc ${rpc} failed:`, error);
    return NextResponse.json({ error: "Lookup failed. Please try again." }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json(
      { error: "No order found with that ID and phone number." },
      { status: 404 }
    );
  }

  return NextResponse.json({ result: data });
}
