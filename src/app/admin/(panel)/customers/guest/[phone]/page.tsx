import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerDetail, type CustomerView } from "@/components/admin/customer-detail";
import { normalizePhone } from "@/lib/utils";
import type { Order, CustomRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

// Guest customers are keyed by their (normalised) phone number, since they
// have no account. We match orders/requests whose phone normalises to the same.
export default async function GuestCustomerPage({ params }: { params: { phone: string } }) {
  const target = normalizePhone(decodeURIComponent(params.phone));
  if (!target) notFound();

  const supabase = createClient();
  const [ordersRes, customRes] = await Promise.all([
    supabase.from("orders").select("*").is("user_id", null).order("created_at", { ascending: false }),
    supabase.from("custom_requests").select("*").is("user_id", null).order("created_at", { ascending: false }),
  ]);

  const orders = ((ordersRes.data as Order[]) ?? []).filter((o) => normalizePhone(o.phone) === target);
  const custom = ((customRes.data as CustomRequest[]) ?? []).filter((r) => normalizePhone(r.phone) === target);

  if (orders.length === 0 && custom.length === 0) notFound();

  const first = orders[0] ?? null;
  const view: CustomerView = {
    name: first?.customer_name ?? custom[0]?.full_name ?? "Guest",
    phone: first?.phone ?? custom[0]?.phone ?? target,
    email: first?.email ?? custom[0]?.email ?? null,
    type: "Guest",
    orders,
    customRequests: custom,
    addresses: [],
  };

  return <CustomerDetail customer={view} />;
}
