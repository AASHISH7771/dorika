"use client";

/**
 * Storefront support widget.
 *
 * Three things happen here:
 *
 *  1. A visitor gives a name before the assistant will talk to them.
 *  2. The assistant answers from our own shop information (no model call, no
 *     API key, no per-message cost) and can be shown a photo.
 *  3. The moment they ask for a person, the assistant is switched off for
 *     that thread — permanently — and staff take over from /admin/support.
 *     Their replies arrive here as "Staff" while the widget polls.
 *
 * The conversation lives in Supabase so the transcript survives a reload and
 * staff can read it. If those tables have not been migrated yet, the widget
 * falls back to answering in the browser rather than showing a broken box —
 * it just cannot save anything or receive a reply.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/components/store-context";
import { createEngine } from "@/lib/support/engine";
import { SUPPORT_GREETING, SUPPORT_KB, SUPPORT_OPENERS } from "@/lib/support/knowledge";
import styles from "./chat-widget.module.css";

type Role = "visitor" | "bot" | "staff";

interface UiMsg {
  /** `srv:<id>` for stored messages, `loc:<n>` for ones only this tab knows. */
  key: string;
  role: Role;
  body: string | null;
  imageUrl?: string | null;
}

interface Chip {
  label: string;
  id: string;
}

interface Thread {
  id: string;
  token: string;
}

interface Stored {
  id: string;
  token: string;
  name: string;
}

const HUMAN = "human";
const STORE_KEY = "dorika.support.v1";
const POLL_MS = 4000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_CHIPS = 4;

// Mirrors WAITING_COPY in lib/support/chat-server.ts. Only used by the
// browser fallback, when there is no server to write the message for us.
const LOCAL_WAITING =
  "Thanks — I've paused and passed this to the team. A member of staff will reply here shortly, so please keep this window open.";

function ChatIcon() {
  return (
    <svg
      className={styles.fabIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg
      className={styles.sendIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

function ClipIcon() {
  return (
    <svg
      className={styles.attachIcon}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21.4 11.05l-9.19 9.19a5 5 0 01-7.07-7.07l9.19-9.19a3.5 3.5 0 014.95 4.95l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SupportWidget() {
  const store = useStore();

  // Used only when the support tables are missing, so the widget still answers.
  const localEngine = useMemo(
    () => createEngine({ kb: SUPPORT_KB, threshold: 3.0, openers: SUPPORT_OPENERS }),
    []
  );

  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [draftName, setDraftName] = useState("");
  const [starting, setStarting] = useState(false);

  const [thread, setThread] = useState<Thread | null>(null);
  const [serverMode, setServerMode] = useState(true);

  const [messages, setMessages] = useState<UiMsg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [status, setStatus] = useState<string>("bot");

  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const seq = useRef(0);
  const lastServerId = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // ── helpers ──────────────────────────────────────────────
  const append = useCallback((...items: UiMsg[]) => {
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.key));
      const fresh = items.filter((m) => !seen.has(m.key));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, []);

  const toUi = useCallback(
    (m: { id: number; role: Role; body: string | null; imageUrl: string | null }): UiMsg => ({
      key: `srv:${m.id}`,
      role: m.role,
      body: m.body,
      imageUrl: m.imageUrl,
    }),
    []
  );

  const think = useCallback((run: () => void) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(run, 480);
  }, []);

  // ── restore ──────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as Stored;
      if (stored?.id && stored?.token && stored?.name) {
        setThread({ id: stored.id, token: stored.token });
        setName(stored.name);
      }
    } catch {
      /* corrupt value — start fresh */
    }
  }, []);

  // Replay the transcript the first time the panel opens for a known thread.
  useEffect(() => {
    if (!open || !thread || messages.length > 0) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(
          `/api/support/poll?id=${encodeURIComponent(thread.id)}&token=${encodeURIComponent(
            thread.token
          )}&after=0`,
          { cache: "no-store" }
        );
        if (cancelled) return;
        if (res.status === 403) {
          // Thread was deleted or the token no longer matches: start over.
          window.localStorage.removeItem(STORE_KEY);
          setThread(null);
          setName("");
          return;
        }
        if (!res.ok) throw new Error("offline");
        const json = await res.json();
        const restored: UiMsg[] = (json.messages ?? []).map(toUi);
        if (restored.length) append(...restored);
        lastServerId.current = Math.max(0, ...(json.messages ?? []).map((m: { id: number }) => Number(m.id)));
        setStatus(json.status ?? "bot");
        setAiEnabled(json.aiEnabled !== false);
        setChips(json.aiEnabled === false ? [] : SUPPORT_OPENERS.slice(0, MAX_CHIPS));
      } catch {
        // Keep whatever the browser knows; polling will retry.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, thread, messages.length, append, toUi]);

  // ── polling: staff replies + handoff state ───────────────
  useEffect(() => {
    if (!open || !thread || !serverMode) return;

    let stopped = false;
    const tick = async () => {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const res = await fetch(
          `/api/support/poll?id=${encodeURIComponent(thread.id)}&token=${encodeURIComponent(
            thread.token
          )}&after=${lastServerId.current}`,
          { cache: "no-store" }
        );
        if (stopped || !res.ok) return;
        const json = await res.json();
        const incoming: (Parameters<typeof toUi>[0] & { id: number })[] = json.messages ?? [];
        if (incoming.length) {
          append(...incoming.map(toUi));
          lastServerId.current = Math.max(
            lastServerId.current,
            ...incoming.map((m) => Number(m.id))
          );
        }
        setStatus(json.status ?? "bot");
        setAiEnabled(json.aiEnabled !== false);
      } catch {
        /* transient — try again next tick */
      }
    };

    const id = setInterval(tick, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(id);
    };
  }, [open, thread, serverMode, append, toUi]);

  // ── panel chrome ─────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const target = name ? inputRef.current : nameRef.current;
    const t = setTimeout(() => target?.focus(), 60);
    return () => clearTimeout(t);
  }, [open, name]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, chips, aiEnabled]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
    },
    [attachmentUrl]
  );

  // ── start a conversation ─────────────────────────────────
  const startChat = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const clean = draftName.replace(/\s+/g, " ").trim().slice(0, 40);
      if (clean.length < 2 || starting) return;

      setStarting(true);
      setError(null);

      try {
        const res = await fetch("/api/support/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: clean }),
        });

        if (res.status === 503) {
          // Tables not migrated yet: answer locally, save nothing.
          setServerMode(false);
          setName(clean);
          append({ key: "loc:hello", role: "bot", body: SUPPORT_GREETING });
          setChips(SUPPORT_OPENERS.slice(0, MAX_CHIPS));
          return;
        }

        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Could not start a chat.");

        setServerMode(true);
        setName(clean);
        setThread({ id: json.id, token: json.token });
        setStatus(json.status ?? "bot");
        setAiEnabled(json.aiEnabled !== false);
        const seeded: UiMsg[] = (json.messages ?? []).map(toUi);
        append(...seeded);
        lastServerId.current = Math.max(0, ...(json.messages ?? []).map((m: { id: number }) => Number(m.id)));
        setChips(json.chips ?? []);
        window.localStorage.setItem(
          STORE_KEY,
          JSON.stringify({ id: json.id, token: json.token, name: clean })
        );
        setTimeout(() => inputRef.current?.focus(), 80);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not start a chat.");
      } finally {
        setStarting(false);
      }
    },
    [append, draftName, starting, toUi]
  );

  // ── send ─────────────────────────────────────────────────
  const send = useCallback(
    async (raw: string) => {
      const body = raw.trim();
      if (busy) return;
      if (!body && !attachment) return;

      setError(null);
      setBusy(true);
      setChips([]);

      const file = attachment;
      const preview = attachmentUrl;
      setDraft("");
      setAttachment(null);
      setAttachmentUrl(null);

      const tmpKey = `loc:${++seq.current}`;
      append({ key: tmpKey, role: "visitor", body: body || null, imageUrl: preview });

      // ── browser-only fallback ──
      if (!serverMode || !thread) {
        const answer = localEngine.answer(body);
        think(() => {
          if (answer.escalate) {
            append({ key: `loc:${++seq.current}`, role: "bot", body: LOCAL_WAITING });
            setAiEnabled(false);
            setStatus("awaiting_staff");
          } else if (answer.miss) {
            append({
              key: `loc:${++seq.current}`,
              role: "bot",
              body: "That one isn't in our shop information yet. Try custom art, pricing, delivery or an order — or ask for a person.",
            });
            setChips([{ label: "Talk to a human", id: HUMAN }, ...SUPPORT_OPENERS.slice(0, 3)]);
          } else {
            append({ key: `loc:${++seq.current}`, role: "bot", body: answer.text });
            setChips(answer.chips);
          }
          setBusy(false);
        });
        return;
      }

      // ── server ──
      try {
        const fd = new FormData();
        fd.set("id", thread.id);
        fd.set("token", thread.token);
        if (body) fd.set("body", body);
        if (file) fd.set("image", file);

        const res = await fetch("/api/support/send", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Could not send that.");

        const stored: UiMsg[] = (json.messages ?? []).map(toUi);
        setMessages((prev) => [...prev.filter((m) => m.key !== tmpKey), ...stored]);
        lastServerId.current = Math.max(
          lastServerId.current,
          ...(json.messages ?? []).map((m: { id: number }) => Number(m.id))
        );
        setChips(json.chips ?? []);
        setAiEnabled(json.aiEnabled !== false);
        setStatus(json.status ?? "bot");
        if (json.imageError) setError("The photo could not be uploaded, but your message went through.");
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.key !== tmpKey));
        setError(err instanceof Error ? err.message : "Could not send that.");
      } finally {
        setBusy(false);
        setTimeout(() => inputRef.current?.focus(), 40);
      }
    },
    [append, attachment, attachmentUrl, busy, localEngine, serverMode, think, thread, toUi]
  );

  // ── hand off to staff ────────────────────────────────────
  const escalate = useCallback(async () => {
    if (busy || !aiEnabled) return;

    setError(null);
    setBusy(true);
    setChips([]);

    if (!serverMode || !thread) {
      append({ key: `loc:${++seq.current}`, role: "visitor", body: "Can I talk to a human?" });
      think(() => {
        append({ key: `loc:${++seq.current}`, role: "bot", body: LOCAL_WAITING });
        setAiEnabled(false);
        setStatus("awaiting_staff");
        setBusy(false);
      });
      return;
    }

    try {
      const fd = new FormData();
      fd.set("id", thread.id);
      fd.set("token", thread.token);
      fd.set("escalate", "1");

      const res = await fetch("/api/support/send", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Could not reach the team.");

      append(...(json.messages ?? []).map(toUi));
      lastServerId.current = Math.max(
        lastServerId.current,
        ...(json.messages ?? []).map((m: { id: number }) => Number(m.id))
      );
      setAiEnabled(false);
      setStatus(json.status ?? "awaiting_staff");
      setChips([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not reach the team.");
      setChips([{ label: "Talk to a human", id: HUMAN }]);
    } finally {
      setBusy(false);
    }
  }, [aiEnabled, append, busy, serverMode, think, thread, toUi]);

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
      setError("Please choose a JPG, PNG, WebP or GIF.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That photo is over 5 MB. Please pick a smaller one.");
      return;
    }

    if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
    setError(null);
    setAttachment(file);
    setAttachmentUrl(URL.createObjectURL(file));
    inputRef.current?.focus();
  }

  function clearAttachment() {
    if (attachmentUrl) URL.revokeObjectURL(attachmentUrl);
    setAttachment(null);
    setAttachmentUrl(null);
  }

  const humanMode = !aiEnabled;

  // ── render ───────────────────────────────────────────────
  return (
    <div className={styles.root}>
      <div
        className={styles.panel}
        role="dialog"
        aria-label={`${store.name} support`}
        hidden={!open}
      >
        <div className={styles.head}>
          <div className={styles.headText}>
            <span className={styles.title}>{store.name} support</span>
          </div>
          <button
            type="button"
            className={styles.close}
            onClick={() => setOpen(false)}
            aria-label="Close support"
          >
            <CloseIcon />
          </button>
        </div>

        {!name ? (
          <form className={styles.gate} onSubmit={startChat}>
            <p className={styles.gateTitle}>What should we call you?</p>
            <p className={styles.gateHint}>
              Just a name so the team knows who they&apos;re helping. Nothing else is asked for.
            </p>
            <div className={styles.gateForm}>
              <input
                ref={nameRef}
                className={styles.gateInput}
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                placeholder="Your name"
                maxLength={40}
                autoComplete="given-name"
                aria-label="Your name"
              />
              <button
                type="submit"
                className={styles.gateBtn}
                disabled={starting || draftName.trim().length < 2}
              >
                {starting ? "Starting…" : "Start chat"}
              </button>
            </div>
            {error && <p className={styles.gateError}>{error}</p>}
          </form>
        ) : (
          <>
            <div
              ref={logRef}
              className={styles.log}
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {messages.map((m) => (
                <div
                  key={m.key}
                  className={
                    m.role === "visitor"
                      ? `${styles.msg} ${styles.user}`
                      : m.role === "staff"
                        ? styles.staff
                        : `${styles.msg} ${styles.bot}`
                  }
                >
                  {m.role === "staff" && <span className={styles.staffName}>Staff</span>}
                  {m.body}
                  {m.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className={styles.bubbleImage} src={m.imageUrl} alt="Attached photo" />
                  )}
                </div>
              ))}

              {busy && (
                <div className={`${styles.msg} ${styles.bot}`} aria-label="Working">
                  <span className={styles.typing}>
                    <i />
                    <i />
                    <i />
                  </span>
                </div>
              )}
            </div>

            <div className={styles.chips}>
              {chips.slice(0, MAX_CHIPS).map((c) => (
                <button
                  key={`${c.id}:${c.label}`}
                  type="button"
                  className={`${styles.chip} ${c.id === HUMAN ? styles.chipHuman : ""}`}
                  onClick={() => (c.id === HUMAN ? escalate() : send(c.label))}
                >
                  {c.label}
                </button>
              ))}
              {!humanMode && !chips.some((c) => c.id === HUMAN) && (
                <button
                  type="button"
                  className={`${styles.chip} ${styles.chipHuman}`}
                  onClick={escalate}
                >
                  Talk to a human
                </button>
              )}
            </div>

            {humanMode && (
              <div className={styles.notice}>
                <span className={styles.noticeDot} aria-hidden="true" />
                Staff have this chat and the assistant is paused. Replies show up here.
              </div>
            )}

            {attachment && attachmentUrl && (
              <div className={styles.preview}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className={styles.previewImg} src={attachmentUrl} alt="" />
                <span className={styles.previewName}>{attachment.name}</span>
                <button
                  type="button"
                  className={styles.previewX}
                  onClick={clearAttachment}
                  aria-label="Remove photo"
                >
                  <XIcon />
                </button>
              </div>
            )}

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                send(draft);
              }}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={styles.fileInput}
                onChange={onPickFile}
              />
              <button
                type="button"
                className={styles.attach}
                onClick={() => fileRef.current?.click()}
                aria-label="Attach a photo"
              >
                <ClipIcon />
              </button>
              <textarea
                ref={inputRef}
                className={styles.input}
                rows={1}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(draft);
                  }
                }}
                placeholder={
                  humanMode
                    ? "Add anything else for the team..."
                    : "Ask about prices, delivery, an order..."
                }
                aria-label="Your message"
              />
              <button
                type="submit"
                className={styles.send}
                aria-label="Send"
                disabled={busy || (!draft.trim() && !attachment)}
              >
                <SendIcon />
              </button>
            </form>

            {error && <div className={styles.error}>{error}</div>}
          </>
        )}
      </div>

      {!open && (
        <button
          type="button"
          className={styles.fab}
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-label="Open help and support"
        >
          <ChatIcon />
          <span className={styles.fabLabel}>Need help?</span>
          <span className={styles.fabDot} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
