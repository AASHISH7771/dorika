import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerDetail, type CustomerView } from "@/components/admin/customer-detail";
import type { Order, CustomRequest, Address, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function RegisteredCustomerPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!profile) notFound();
  const p = profile as Profile;

  const [orders, custom, addresses] = await Promise.all([
    supabase.from("orders").select("*").eq("user_id", p.id).order("created_at", { ascending: false }),
    supabase.from("custom_requests").select("*").eq("user_id", p.id).order("created_at", { ascending: false }),
    supabase.from("addresses").select("*").eq("user_id", p.id).order("is_default", { ascending: false }),
  ]);

  const view: CustomerView = {
    name: p.full_name || p.email || "Customer",
    phone: p.phone || "",
    email: p.email,
    type: "Registered",
    joined: p.created_at,
    orders: (orders.data as Order[]) ?? [],
    customRequests: (custom.data as CustomRequest[]) ?? [],
    addresses: (addresses.data as Address[]) ?? [],
  };

  return <CustomerDetail customer={view} />;
}
