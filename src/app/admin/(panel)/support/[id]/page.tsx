import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { hydrate, isMissingTable } from "@/lib/support/chat-server";
import { LiveRefresh } from "@/components/admin/live-refresh";
import { closeThread, reopenThread, replyToThread } from "../actions";

export const dynamic = "force-dynamic";

interface ThreadRow {
  id: string;
  visitor_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  ai_enabled: boolean;
  unread_for_staff: number;
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  bot: "Assistant is answering",
  awaiting_staff: "Waiting for you",
  staff_chat: "You're in this conversation",
  closed: "Closed",
};

function time(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SupportThreadPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { sent?: string; error?: string };
}) {
  const admin = createAdminClient();

  const { data: threadData, error: threadError } = await admin
    .from("support_threads")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();

  if (isMissingTable(threadError)) notFound();

  const thread = threadData as ThreadRow | null;
  if (!thread) notFound();

  const { data: rows } = await admin
    .from("support_messages")
    .select("id, role, body, image_path, created_at")
    .eq("thread_id", thread.id)
    .order("id", { ascending: true });

  const messages = await hydrate(rows ?? []);

  // Opening the conversation is what "reads" it.
  if (thread.unread_for_staff > 0) {
    await admin.from("support_threads").update({ unread_for_staff: 0 }).eq("id", thread.id);
  }

  return (
    <>
      <LiveRefresh ms={8000} />

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/support" className="text-xs font-semibold text-terracotta-600 hover:underline">
            ← All chats
          </Link>
          <h1 className="mt-1 text-2xl font-extrabold">{thread.visitor_name}</h1>
          <p className="mt-1 text-sm text-charcoal-400">
            {STATUS_LABEL[thread.status] ?? thread.status} · started {time(thread.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          {thread.status === "closed" ? (
            <form action={reopenThread}>
              <input type="hidden" name="id" value={thread.id} />
              <button className="btn-outline btn-sm" type="submit">
                Reopen
              </button>
            </form>
          ) : (
            <form action={closeThread}>
              <input type="hidden" name="id" value={thread.id} />
              <button className="btn-outline btn-sm" type="submit">
                Close chat
              </button>
            </form>
          )}
        </div>
      </div>

      {searchParams.sent && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Reply sent — it is already in their chat window.
        </div>
      )}
      {searchParams.error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {searchParams.error === "empty"
            ? "Nothing to send — type a reply first."
            : "The reply could not be saved. Try again."}
        </div>
      )}

      <div className="rounded-2xl border border-charcoal-100 bg-white">
        <div className="max-h-[52vh] space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-8 text-center text-sm text-charcoal-400">No messages yet.</p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={m.role === "staff" ? "flex justify-end" : "flex justify-start"}
            >
              <div className="max-w-[80%]">
                <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-charcoal-400">
                  {m.role === "visitor" ? thread.visitor_name : m.role === "staff" ? "You" : "Assistant"}
                  <span className="ml-2 font-normal normal-case tracking-normal text-charcoal-300">
                    {time(m.createdAt)}
                  </span>
                </p>
                <div
                  className={
                    m.role === "staff"
                      ? "rounded-2xl rounded-br-sm bg-terracotta-500 px-3.5 py-2.5 text-sm text-white"
                      : m.role === "visitor"
                        ? "rounded-2xl rounded-bl-sm bg-charcoal-50 px-3.5 py-2.5 text-sm text-charcoal-800"
                        : "rounded-2xl rounded-bl-sm bg-white px-3.5 py-2.5 text-sm text-charcoal-500 ring-1 ring-charcoal-100"
                  }
                >
                  {m.body}
                  {m.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.imageUrl}
                      alt="Photo from the customer"
                      className="mt-2 max-h-64 rounded-lg border border-charcoal-100"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <form action={replyToThread} className="border-t border-charcoal-100 p-4">
          <input type="hidden" name="id" value={thread.id} />
          <label htmlFor="body" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-charcoal-400">
            Reply as Staff
          </label>
          <textarea
            id="body"
            name="body"
            rows={3}
            required
            maxLength={2000}
            placeholder={`Reply to ${thread.visitor_name}…`}
            className="w-full rounded-xl border border-charcoal-200 px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-charcoal-400">
              Appears in their widget as “Staff”. The assistant stays off for this chat.
            </p>
            <button className="btn-primary btn-sm" type="submit">
              Send reply
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
