import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/admin/ui";
import { MessageList } from "@/components/admin/message-list";
import type { ContactMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    // Unread first, then newest
    .order("is_read", { ascending: true })
    .order("created_at", { ascending: false });

  const messages = (data as ContactMessage[]) ?? [];
  const unread = messages.filter((m) => !m.is_read).length;

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle={`${messages.length} total · ${unread} unread`}
      />
      <MessageList messages={messages} />
    </>
  );
}
