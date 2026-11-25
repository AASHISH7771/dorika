import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader, EmptyState } from "@/components/admin/ui";
import { isMissingTable, type SupportStatus } from "@/lib/support/chat-server";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<SupportStatus, string> = {
  bot: "Assistant",
  awaiting_staff: "Waiting for you",
  staff_chat: "In conversation",
  closed: "Closed",
};

const STATUS_STYLE: Record<SupportStatus, string> = {
  bot: "bg-charcoal-100 text-charcoal-600",
  awaiting_staff: "bg-amber-100 text-amber-800",
  staff_chat: "bg-green-100 text-green-800",
  closed: "bg-charcoal-100 text-charcoal-400",
};

function ago(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days}d ago`;
}

interface Row {
  id: string;
  visitor_name: string;
  status: SupportStatus;
  unread_for_staff: number;
  last_message_at: string;
}

export default async function AdminSupportPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("support_threads")
    .select("id, visitor_name, status, unread_for_staff, last_message_at")
    .order("last_message_at", { ascending: false })
    .limit(100);

  if (isMissingTable(error)) {
    return (
      <>
        <PageHeader title="Support chats" subtitle="Customer conversations from the website widget" />
        <EmptyState
          title="Not set up yet"
          hint="Run supabase/06_support_chat.sql in the Supabase SQL editor, then reload this page. Until then the widget answers questions but cannot save the chat."
        />
      </>
    );
  }

  const threads = (data as Row[]) ?? [];
  const waiting = threads.filter((t) => t.status === "awaiting_staff").length;
  const unread = threads.reduce((n, t) => n + (t.unread_for_staff > 0 ? 1 : 0), 0);

  return (
    <>
      <PageHeader
        title="Support chats"
        subtitle={`${threads.length} total · ${waiting} waiting · ${unread} unread`}
      />

      {threads.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          hint="When a customer opens the help widget on the website, the chat shows up here."
        />
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/admin/support/${t.id}`}
                className="flex items-center gap-4 rounded-2xl border border-charcoal-100 bg-white p-4 transition-colors hover:border-terracotta-300"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-terracotta-50 text-sm font-extrabold text-terracotta-600">
                  {t.visitor_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-bold text-charcoal-800">
                    <span className="truncate">{t.visitor_name}</span>
                    {t.unread_for_staff > 0 && (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta-500 px-1.5 text-[11px] font-bold text-white">
                        {t.unread_for_staff}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-charcoal-400">Last message {ago(t.last_message_at)}</p>
                </div>
                <span className={`badge ${STATUS_STYLE[t.status] ?? STATUS_STYLE.bot}`}>
                  {STATUS_LABEL[t.status] ?? t.status}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
