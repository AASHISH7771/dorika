"use client";

/**
 * Storefront support widget.
 *
 * Answers come from `@/lib/support/knowledge`, which is derived from the FAQ
 * page, so the two cannot drift. There is no model call and no API key: the
 * whole thing ships as static client JS, costs nothing to run, and cannot
 * invent an answer. When it does not know something it says so and offers a
 * human — the WhatsApp/email links carry the visitor's actual question across.
 *
 * Phone, email and shop name come from `useStore()` (the Settings row), so an
 * edit in the admin panel changes the handoff details with no code change.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/components/store-context";
import { createEngine, HUMAN_ID, type Chip } from "@/lib/support/engine";
import { SUPPORT_GREETING, SUPPORT_KB, SUPPORT_OPENERS } from "@/lib/support/knowledge";
import styles from "./chat-widget.module.css";

type MsgBody =
  | { kind: "bot" | "user"; text: string }
  | { kind: "escalate"; question: string };

type Msg = MsgBody & { key: number };

/** Fake thinking pause. Long enough to read as a reply, short enough not to annoy. */
const THINK_MS = 520;
const MAX_CHIPS = 4;

const FOLLOW_UPS: Chip[] = [
  { label: "Delivery charges", id: "delivery-fee" },
  { label: "Track my order", id: "track-order" },
];

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

export function SupportWidget() {
  const store = useStore();

  const engine = useMemo(
    () => createEngine({ kb: SUPPORT_KB, threshold: 3.0, openers: SUPPORT_OPENERS }),
    []
  );

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [chips, setChips] = useState<Chip[]>([]);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState("");
  const [misses, setMisses] = useState(0);

  const seq = useRef(0);
  const lastQuestion = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const push = useCallback((msg: MsgBody) => {
    seq.current += 1;
    setMessages((prev) => [...prev, { ...msg, key: seq.current } as Msg]);
  }, []);

  /** Queue a bot action behind the typing indicator. */
  const think = useCallback(
    (run: () => void) => {
      setBusy(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        run();
        setBusy(false);
      }, THINK_MS);
    },
    []
  );

  const escalate = useCallback(
    (question: string, line: string) => {
      push({ kind: "bot", text: line });
      push({ kind: "escalate", question });
      setChips(FOLLOW_UPS);
    },
    [push]
  );

  const reply = useCallback(
    (question: string) => {
      const result = engine.answer(question);

      if (result.escalate) {
        escalate(question, "No problem, I'll hand you over.");
        setMisses(0);
        return;
      }

      if (result.miss) {
        const next = misses + 1;
        setMisses(next);
        push({
          kind: "bot",
          text:
            next > 1
              ? "I'm not finding that one, and guessing would waste your time. A human will answer it properly."
              : "That one isn't in our shop information yet. A human can answer it — or try custom art, pricing, delivery or an order.",
        });
        push({ kind: "escalate", question });
        setChips([]);
        return;
      }

      push({ kind: "bot", text: result.text });
      setChips(result.chips);
      setMisses(0);
    },
    [engine, escalate, misses, push]
  );

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || busy) return;

      lastQuestion.current = text;
      setDraft("");
      setChips([]);
      push({ kind: "user", text });
      think(() => {
        reply(text);
        inputRef.current?.focus();
      });
    },
    [busy, push, reply, think]
  );

  const ask = useCallback(
    (id: string) => {
      if (busy) return;

      if (id === HUMAN_ID) {
        setChips([]);
        push({ kind: "user", text: "Can I talk to a human?" });
        think(() => escalate(lastQuestion.current, "Of course."));
        return;
      }

      const entry = engine.entryById(id);
      if (!entry) {
        send(id);
        return;
      }

      setChips([]);
      push({ kind: "user", text: entry.q });
      think(() => {
        push({ kind: "bot", text: entry.a });
        setChips(engine.answer(entry.q).chips);
        inputRef.current?.focus();
      });
    },
    [busy, engine, escalate, push, send, think]
  );

  // Greet on first open only, so re-opening keeps the transcript.
  useEffect(() => {
    if (!open) return;
    setMessages((prev) => {
      if (prev.length) return prev;
      return [
        { key: 0, kind: "bot", text: SUPPORT_GREETING },
      ];
    });
    setChips((prev) => (prev.length ? prev : SUPPORT_OPENERS.slice(0, MAX_CHIPS)));
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => inputRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, busy, chips]);

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
    },
    []
  );

  const waHref = useCallback(
    (question: string) => {
      const text = question
        ? `Hi ${store.name}, I was asking about: "${question}"`
        : `Hi ${store.name}, I need a hand with something.`;
      return `https://wa.me/${store.whatsapp}?text=${encodeURIComponent(text)}`;
    },
    [store.name, store.whatsapp]
  );

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
            <span className={styles.status}>
              <i className={styles.statusDot} aria-hidden="true" />
              Instant answers · human on request
            </span>
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

        <div
          ref={logRef}
          className={styles.log}
          role="log"
          aria-live="polite"
          aria-relevant="additions"
        >
          {messages.map((m) =>
            m.kind === "escalate" ? (
              <div key={m.key} className={styles.escalate}>
                <p>
                  <strong className={styles.escalateStrong}>A human can pick this up</strong>
                  WhatsApp {store.phoneDisplay} · usually a few minutes. Mention your order ID if
                  it&apos;s about an order.
                </p>
                <div className={styles.actions}>
                  <a
                    className={`${styles.btn} ${styles.btnPrimary}`}
                    href={waHref(m.question)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                  <a
                    className={`${styles.btn} ${styles.btnGhost}`}
                    href={`mailto:${store.email}?subject=${encodeURIComponent("Help with an order")}`}
                  >
                    Email instead
                  </a>
                </div>
              </div>
            ) : (
              <div
                key={m.key}
                className={`${styles.msg} ${m.kind === "user" ? styles.user : styles.bot}`}
              >
                {m.text}
              </div>
            )
          )}

          {busy && (
            <div className={`${styles.msg} ${styles.bot}`} aria-label="Typing">
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
              className={styles.chip}
              onClick={() => ask(c.id)}
            >
              {c.label}
            </button>
          ))}
        </div>

        <form
          className={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            send(draft);
          }}
        >
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
            placeholder="Ask about prices, delivery, an order..."
            aria-label="Your question"
          />
          <button type="submit" className={styles.send} aria-label="Send" disabled={busy}>
            <SendIcon />
          </button>
        </form>

        <div className={styles.foot}>Answers from our shop info · not a live person</div>
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
