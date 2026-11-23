import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  rateLimit, getClientIp, isHoneypotTripped, verifyTurnstile, HONEYPOT_FIELD,
} from "@/lib/security";
import { generateOrderNo, isValidNepaliPhone } from "@/lib/utils";
import { sendEmail, orderConfirmationHtml } from "@/lib/email";
import { siteConfig } from "@/lib/config";
import type { CartItem, PaymentMethod } from "@/lib/types";

export const runtime = "nodejs";

interface OrderBody {
  customer_name: string;
  phone: string;
  email?: string;
  district?: string;
  city?: string;
  address?: string;
  landmark?: string;
  notes?: string;
  payment_method: PaymentMethod;
  items: CartItem[];
  [HONEYPOT_FIELD]?: string;
  turnstileToken?: string;
  payment_reference?: string | null;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`order:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: OrderBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — pretend success so bots don't learn
  if (isHoneypotTripped(body[HONEYPOT_FIELD])) {
    return NextResponse.json({ order_no: generateOrderNo(), ok: true });
  }

  // Turnstile (if configured)
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json({ error: "Verification failed. Please try again." }, { status: 400 });
  }

  // Validate
  if (!body.customer_name?.trim() || !isValidNepaliPhone(body.phone || "")) {
    return NextResponse.json({ error: "Please provide a valid name and phone number." }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  // Non-COD orders are paid manually to the shop wallet or bank account, so we
  // need the transaction id to reconcile the transfer against the statement.
  const isManualPayment = (body.payment_method ?? "cod") !== "cod";
  const reference = String(body.payment_reference ?? "").trim().slice(0, 120);
  if (isManualPayment && !reference) {
    return NextResponse.json(
      { error: "Please paste the transaction ID from your payment." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Re-price from DB (never trust client prices)
  const ids = body.items.map((i) => i.productId);
  const { data: dbProducts, error: prodErr } = await admin
    .from("products")
    .select("id, name, price, images, stock, is_active")
    .in("id", ids);
  if (prodErr) {
    return NextResponse.json({ error: "Could not verify products." }, { status: 500 });
  }

  const priceMap = new Map((dbProducts ?? []).map((p) => [p.id, p]));
  let subtotal = 0;
  const lineItems = body.items.map((i) => {
    const p = priceMap.get(i.productId);
    const unit = p?.price ?? i.price;
    const qty = Math.max(1, Math.min(i.quantity, 99));
    const line = unit * qty;
    subtotal += line;
    return {
      product_id: i.productId,
      product_name: p?.name ?? i.name,
      image_url: p?.images?.[0] ?? i.image,
      unit_price: unit,
      quantity: qty,
      line_total: line,
    };
  });

  // Delivery fee from settings
  const { data: settings } = await admin.from("settings").select("*").eq("id", 1).single();
  const deliveryFee =
    settings && subtotal >= Number(settings.free_delivery_over)
      ? 0
      : Number(settings?.delivery_fee ?? 150);
  const total = subtotal + deliveryFee;

  // Attach to logged-in user if any
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const order_no = generateOrderNo();
  const { data: order, error: orderErr } = await admin
    .from("orders")
    .insert({
      order_no,
      user_id: user?.id ?? null,
      customer_name: body.customer_name.trim(),
      phone: body.phone.trim(),
      email: body.email?.trim() || null,
      district: body.district?.trim() || null,
      city: body.city?.trim() || null,
      address: body.address?.trim() || null,
      landmark: body.landmark?.trim() || null,
      notes: body.notes?.trim() || null,
      subtotal,
      delivery_fee: deliveryFee,
      total,
      payment_method: body.payment_method ?? "cod",
      // COD settles on delivery; manual transfers stay pending until the owner
      // confirms them against the wallet/bank statement.
      payment_status: isManualPayment ? "pending" : "unpaid",
      payment_reference: reference || null,
      status: "pending",
    })
    .select()
    .single();

  if (orderErr || !order) {
    console.error("[orders] insert failed:", orderErr);
    return NextResponse.json({ error: "Could not create order. Please try again." }, { status: 500 });
  }

  // Items + initial status event
  await admin.from("order_items").insert(lineItems.map((li) => ({ ...li, order_id: order.id })));
  await admin.from("order_events").insert({
    order_id: order.id,
    status: "pending",
    note: "Order received.",
  });

  // Confirmation email (best effort)
  if (body.email) {
    await sendEmail({
      to: body.email,
      subject: `Dorika: order ${order_no} received`,
      html: orderConfirmationHtml({
        orderNo: order_no,
        name: body.customer_name,
        amount: total,
        trackUrl: `${siteConfig.url}/track?order=${order_no}`,
        kind: "order",
      }),
    });
  }

  return NextResponse.json({ order_no, total, ok: true });
}
