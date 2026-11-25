import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { AdminSidebar, type AdminBadges } from "@/components/admin/admin-sidebar";
import { signOut } from "../login/actions";

async function getBadges(): Promise<AdminBadges> {
  try {
    const supabase = createClient();
    const [orders, custom, messages] = await Promise.all([
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("custom_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    ]);

    // Counted separately: if 06_support_chat.sql has not been run yet, only
    // this badge goes missing instead of blanking every badge on the sidebar.
    let openChats = 0;
    try {
      const admin = createAdminClient();
      const { count } = await admin
        .from("support_threads")
        .select("id", { count: "exact", head: true })
        .gt("unread_for_staff", 0);
      openChats = count ?? 0;
    } catch {
      openChats = 0;
    }

    return {
      pendingOrders: orders.count ?? 0,
      pendingCustom: custom.count ?? 0,
      unreadMessages: messages.count ?? 0,
      openChats,
    };
  } catch {
    return { pendingOrders: 0, pendingCustom: 0, unreadMessages: 0, openChats: 0 };
  }
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireAdmin();
  const badges = await getBadges();

  return (
    <div className="min-h-screen bg-cream-200">
      <AdminSidebar email={profile.email ?? "admin"} badges={badges} signOut={signOut} />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
