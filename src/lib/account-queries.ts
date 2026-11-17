import "server-only";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import type {
  Address,
  CustomRequest,
  OrderEvent,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Profile,
} from "@/lib/types";

// ─────────────────────────────────────────────────────────────
//  Customer account reads.
//
//  Every query runs through the cookie-bound Supabase client, so
//  Postgres RLS (see supabase/02_rls.sql) is the real guard: a
//  customer can only ever read rows where user_id = auth.uid().
//  The explicit .eq("user_id", userId) filters below are just
//  belt-and-braces and also keep the query plans fast.
// ─────────────────────────────────────────────────────────────

export interface AccountOrderRow {
  id: string;
  order_no: string;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  item_count: number;
  first_item_name: string | null;
}

export interface AccountOrderDetail {
  id: string;
  order_no: string;
  customer_name: string;
  phone: string;
  email: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  landmark: string | null;
  notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  items: {
    id: string;
    product_name: string;
    image_url: string | null;
    unit_price: number;
    quantity: number;
    line_total: number;
  }[];
  events: OrderEvent[];
}

export interface AccountSummary {
  orders: number;
  spent: number;
  openOrders: number;
  customRequests: number;
  addresses: number;
}

export async function getAccountOrders(userId: string): Promise<AccountOrderRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_no, total, status, payment_method, payment_status, created_at, order_items(id, product_name, quantity)"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    type Row = AccountOrderRow & { order_items?: { product_name: string }[] | null };

    return (data as unknown as Row[]).map((row) => {
      const items = row.order_items ?? [];
      return {
        id: row.id,
        order_no: row.order_no,
        total: Number(row.total ?? 0),
        status: row.status,
        payment_method: row.payment_method,
        payment_status: row.payment_status,
        created_at: row.created_at,
        item_count: items.length,
        first_item_name: items[0]?.product_name ?? null,
      };
    });
  } catch {
    return [];
  }
}

export async function getAccountOrder(
  userId: string,
  orderNo: string
): Promise<AccountOrderDetail | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id, order_no, customer_name, phone, email, district, city, address, landmark, notes, subtotal, delivery_fee, total, status, payment_method, payment_status, created_at, order_items(id, product_name, image_url, unit_price, quantity, line_total), order_events(status, note, created_at)"
      )
      .eq("user_id", userId)
      .eq("order_no", orderNo)
      .maybeSingle();

    if (error || !data) return null;

    const row = data as unknown as AccountOrderDetail & {
      order_items?: AccountOrderDetail["items"] | null;
      order_events?: OrderEvent[] | null;
    };

    return {
      ...row,
      subtotal: Number(row.subtotal ?? 0),
      delivery_fee: Number(row.delivery_fee ?? 0),
      total: Number(row.total ?? 0),
      items: (row.order_items ?? []).map((i) => ({
        ...i,
        unit_price: Number(i.unit_price ?? 0),
        line_total: Number(i.line_total ?? 0),
        quantity: Number(i.quantity ?? 0),
      })),
      events: [...(row.order_events ?? [])].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ),
    };
  } catch {
    return null;
  }
}

export async function getAccountCustomRequests(userId: string): Promise<CustomRequest[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("custom_requests")
      .select(
        "id, request_no, user_id, photo_path, full_name, phone, whatsapp, email, district, municipality, ward_tole, full_address, landmark, alt_phone, preferred_date, gift_or_self, background_pref, special_instructions, plank_size, price, status, payment_status, admin_notes, created_at, updated_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return (data as unknown as CustomRequest[]).map((r) => ({
      ...r,
      price: Number(r.price ?? 0),
    }));
  } catch {
    return [];
  }
}

export async function getAccountAddresses(userId: string): Promise<Address[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("user_id", userId)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as unknown as Address[];
  } catch {
    return [];
  }
}

export async function getAccountProfile(
  userId: string,
  fallbackEmail: string | null
): Promise<Profile> {
  const base: Profile = {
    id: userId,
    email: fallbackEmail,
    full_name: null,
    phone: null,
    role: "customer",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (!isSupabaseConfigured()) return base;

  try {
    const supabase = createClient();
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!data) return base;
    return { ...base, ...(data as unknown as Profile), email: (data as Profile).email ?? fallbackEmail };
  } catch {
    return base;
  }
}

export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  const [orders, customRequests, addresses] = await Promise.all([
    getAccountOrders(userId),
    getAccountCustomRequests(userId),
    getAccountAddresses(userId),
  ]);

  const openStatuses: OrderStatus[] = ["pending", "confirmed", "in_progress", "shipped"];

  return {
    orders: orders.length,
    spent: orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + Number(o.total ?? 0), 0),
    openOrders: orders.filter((o) => openStatuses.includes(o.status)).length,
    customRequests: customRequests.length,
    addresses: addresses.length,
  };
}
