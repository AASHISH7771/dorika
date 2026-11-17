import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const runtime = "nodejs";

function csvEscape(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows.map((r) => r.map(csvEscape).join(",")).join("\r\n");
}

export async function GET(req: NextRequest) {
  const supabase = createClient();

  // Admin check (route handlers can't redirect() cleanly → return 403 JSON).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const type = req.nextUrl.searchParams.get("type") ?? "orders";
  const date = new Date().toISOString().slice(0, 10);

  if (type === "sales") {
    // Aggregated daily sales
    const { data } = await supabase
      .from("orders")
      .select("total, status, created_at")
      .neq("status", "cancelled")
      .order("created_at", { ascending: true });

    const byDay = new Map<string, { orders: number; revenue: number }>();
    (data as { total: number; created_at: string }[] | null)?.forEach((o) => {
      const d = o.created_at.slice(0, 10);
      const row = byDay.get(d) ?? { orders: 0, revenue: 0 };
      row.orders += 1;
      row.revenue += Number(o.total);
      byDay.set(d, row);
    });

    const rows: (string | number)[][] = [["Date", "Orders", "Revenue (Rs.)"]];
    Array.from(byDay.entries()).forEach(([d, r]) => rows.push([d, r.orders, r.revenue]));

    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dorika-sales-${date}.csv"`,
      },
    });
  }

  // type === "orders"
  const status = req.nextUrl.searchParams.get("status");
  const payment = req.nextUrl.searchParams.get("payment");
  const q = req.nextUrl.searchParams.get("q");

  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  if (payment) query = query.eq("payment_status", payment);
  if (q) {
    const clean = q.replace(/[%,]/g, "");
    query = query.or(`order_no.ilike.%${clean}%,customer_name.ilike.%${clean}%,phone.ilike.%${clean}%`);
  }

  const { data } = await query;
  const orders = (data as Order[]) ?? [];

  const rows: (string | number | null)[][] = [
    [
      "Order No",
      "Date",
      "Customer",
      "Phone",
      "Email",
      "District",
      "City",
      "Address",
      "Subtotal",
      "Delivery",
      "Total",
      "Payment Method",
      "Payment Status",
      "Status",
    ],
  ];
  for (const o of orders) {
    rows.push([
      o.order_no,
      o.created_at.slice(0, 10),
      o.customer_name,
      o.phone,
      o.email,
      o.district,
      o.city,
      o.address,
      o.subtotal,
      o.delivery_fee,
      o.total,
      o.payment_method,
      o.payment_status,
      o.status,
    ]);
  }

  return new NextResponse(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dorika-orders-${date}.csv"`,
    },
  });
}
