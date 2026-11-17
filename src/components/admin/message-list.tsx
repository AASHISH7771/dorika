"use client";

import { useState } from "react";
import { Mail, MailOpen, Trash2, CornerUpLeft } from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import type { ContactMessage } from "@/lib/types";
import { setMessageRead, deleteMessage } from "@/app/admin/(panel)/messages/actions";

export function MessageList({ messages }: { messages: ContactMessage[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (messages.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-charcoal-200 bg-white/60 px-6 py-16 text-center">
        <h3 className="text-lg font-bold text-charcoal-700">No messages</h3>
        <p className="mt-1 text-sm text-charcoal-400">Contact form submissions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="card divide-y divide-charcoal-100 overflow-hidden">
      {messages.map((m) => {
        const open = openId === m.id;
        return (
          <div key={m.id} className={m.is_read ? "" : "bg-terracotta-50/40"}>
            <button
              onClick={() => {
                setOpenId(open ? null : m.id);
                if (!m.is_read && !open) {
                  const fd = new FormData();
                  fd.set("id", m.id);
                  fd.set("is_read", "true");
                  setMessageRead(fd);
                }
              }}
              className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-cream-100"
            >
              <span className="shrink-0">
                {m.is_read ? (
                  <MailOpen className="h-5 w-5 text-charcoal-300" />
                ) : (
                  <Mail className="h-5 w-5 text-terracotta-500" />
                )}
              </span>
              <span className="flex-1 overflow-hidden">
                <span className="flex items-center justify-between gap-2">
                  <span className={"truncate " + (m.is_read ? "font-medium" : "font-bold")}>
                    {m.name}
                  </span>
                  <span className="shrink-0 text-xs text-charcoal-400">{formatDateTime(m.created_at)}</span>
                </span>
                <span className="block truncate text-sm text-charcoal-500">
                  {m.subject || "(no subject)"} — {m.message}
                </span>
              </span>
            </button>

            {open && (
              <div className="space-y-4 border-t border-charcoal-100 bg-cream-100 px-5 py-4">
                <div className="text-sm text-charcoal-500">
                  <p>
                    <span className="font-semibold text-charcoal-700">From:</span> {m.name}
                    {m.email ? ` · ${m.email}` : ""}
                    {m.phone ? ` · ${m.phone}` : ""}
                  </p>
                  {m.subject && (
                    <p className="mt-0.5">
                      <span className="font-semibold text-charcoal-700">Subject:</span> {m.subject}
                    </p>
                  )}
                </div>
                <p className="whitespace-pre-wrap rounded-xl bg-white p-4 text-sm text-charcoal-700">
                  {m.message}
                </p>
                <div className="flex flex-wrap gap-2">
                  {m.email && (
                    <a
                      href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || "Your message to Dorika"}`)}`}
                      className="btn-primary btn-sm"
                    >
                      <CornerUpLeft className="h-4 w-4" /> Reply via email
                    </a>
                  )}
                  <form action={setMessageRead}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="is_read" value={String(!m.is_read)} />
                    <button type="submit" className="btn-outline btn-sm">
                      Mark {m.is_read ? "unread" : "read"}
                    </button>
                  </form>
                  <form action={deleteMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <button type="submit" className="btn-ghost btn-sm text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" /> Delete
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
