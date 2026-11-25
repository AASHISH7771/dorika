// ─────────────────────────────────────────────────────────────
//  Support chat — server side.
//
//  The storefront never touches Postgres directly. It calls the three
//  routes under `app/api/support/*`, which run with the service role and
//  identify the caller by the per-thread `token`. That keeps the tables
//  locked down (admin-only RLS) while still letting an anonymous visitor
//  own a conversation.
//
//  The assistant runs here, not in the browser: the knowledge base stays on
//  the server, and the client cannot write rows of arbitrary `role: "staff"`.
// ─────────────────────────────────────────────────────────────

import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { createEngine, type Chip } from "./engine";
import { SUPPORT_GREETING, SUPPORT_KB, SUPPORT_OPENERS } from "./knowledge";

export { SUPPORT_OPENERS };

export const SUPPORT_BUCKET = "support-uploads";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_BODY_CHARS = 2000;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export const WAITING_COPY =
  "Thanks — I've paused and passed this to the team. A member of staff will reply here shortly, so please keep this window open. You can add anything else you want them to see.";

export const IMAGE_COPY =
  "I can't open images myself, but the photo is saved with this chat. If you need someone to look at it, a member of staff can.";

export type SupportStatus = "bot" | "awaiting_staff" | "staff_chat" | "closed";
export type SupportRole = "visitor" | "bot" | "staff";

export interface ChatMessage {
  id: number;
  role: SupportRole;
  body: string | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface ThreadRow {
  id: string;
  token: string;
  visitor_name: string;
  email: string | null;
  phone: string | null;
  status: SupportStatus;
  ai_enabled: boolean;
  unread_for_staff: number;
  last_message_at: string;
  created_at: string;
}

const engine = createEngine({ kb: SUPPORT_KB, threshold: 3.0, openers: SUPPORT_OPENERS });

/** Postgres "undefined table" / PostgREST "not in schema cache". */
export function isMissingTable(error: { code?: string } | null): boolean {
  return !!error && (error.code === "42P01" || error.code === "PGRST205");
}

export function newToken(): string {
  return randomBytes(24).toString("hex");
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

export function cleanName(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
}

/** Trim, collapse whitespace, cap length. Keeps the transcript readable. */
export function cleanBody(raw: unknown): string {
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_BODY_CHARS);
}

export async function signImage(path: string | null): Promise<string | null> {
  if (!path) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage.from(SUPPORT_BUCKET).createSignedUrl(path, 60 * 60 * 6);
  return data?.signedUrl ?? null;
}

/** Attach signed URLs to any message that carries a photo. */
export async function hydrate(
  rows: { id: number; role: SupportRole; body: string | null; image_path: string | null; created_at: string }[]
): Promise<ChatMessage[]> {
  return Promise.all(
    rows.map(async (row) => ({
      id: Number(row.id),
      role: row.role,
      body: row.body,
      imageUrl: await signImage(row.image_path),
      createdAt: row.created_at,
    }))
  );
}

export async function createThread(name: string): Promise<{ thread: ThreadRow; greeting: ChatMessage[] }> {
  const admin = createAdminClient();
  const token = newToken();

  const { data, error } = await admin
    .from("support_threads")
    .insert({ visitor_name: name, token })
    .select("*")
    .single();

  if (error) throw error;

  const thread = data as ThreadRow;
  const greeting = await addMessage(thread.id, "bot", SUPPORT_GREETING, null);
  return { thread, greeting: greeting ? [greeting] : [] };
}

export async function getThread(id: string, token: string): Promise<ThreadRow | null> {
  if (!isUuid(id) || !token) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("support_threads")
    .select("*")
    .eq("id", id)
    .eq("token", token)
    .maybeSingle();
  return (data as ThreadRow) ?? null;
}

export async function addMessage(
  threadId: string,
  role: SupportRole,
  body: string | null,
  imagePath: string | null
): Promise<ChatMessage | null> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("support_messages")
    .insert({ thread_id: threadId, role, body, image_path: imagePath })
    .select("id, role, body, image_path, created_at")
    .single();

  if (error || !data) return null;

  const patch: Record<string, unknown> = { last_message_at: new Date().toISOString() };
  if (role === "visitor") {
    const { data: current } = await admin
      .from("support_threads")
      .select("unread_for_staff")
      .eq("id", threadId)
      .maybeSingle();
    patch.unread_for_staff = Number(current?.unread_for_staff ?? 0) + 1;
  }
  await admin.from("support_threads").update(patch).eq("id", threadId);

  const [message] = await hydrate([data]);
  return message ?? null;
}

export async function listMessages(threadId: string, afterId = 0): Promise<ChatMessage[]> {
  const admin = createAdminClient();
  let query = admin
    .from("support_messages")
    .select("id, role, body, image_path, created_at")
    .eq("thread_id", threadId);

  if (afterId > 0) query = query.gt("id", afterId);

  const { data } = await query.order("id", { ascending: true }).limit(200);
  return hydrate(data ?? []);
}

export async function setThreadState(
  threadId: string,
  patch: { status?: SupportStatus; ai_enabled?: boolean; unread_for_staff?: number }
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("support_threads").update(patch).eq("id", threadId);
}

export interface AssistantTurn {
  /** What the assistant said, already persisted. */
  messages: ChatMessage[];
  /** Follow-up chips to render. Empty once a human has been requested. */
  chips: Chip[];
  aiEnabled: boolean;
  status: SupportStatus;
}

const HUMAN_CHIP: Chip = { label: "Talk to a human", id: "human" };

/**
 * Hands the thread to staff. Runs once: `ai_enabled` is the flag that stops
 * the assistant writing into this conversation ever again.
 */
export async function handOff(thread: ThreadRow): Promise<AssistantTurn> {
  const message = await addMessage(thread.id, "bot", WAITING_COPY, null);
  await setThreadState(thread.id, { ai_enabled: false, status: "awaiting_staff" });
  return {
    messages: message ? [message] : [],
    chips: [],
    aiEnabled: false,
    status: "awaiting_staff",
  };
}

/** One assistant turn, persisted. `image` means the visitor sent a photo. */
export async function runAssistant(
  thread: ThreadRow,
  input: { body: string; hasImage: boolean }
): Promise<AssistantTurn> {
  if (!thread.ai_enabled) {
    return { messages: [], chips: [], aiEnabled: false, status: thread.status };
  }

  // A photo the assistant cannot see. Say so, and point at the humans who can.
  if (input.hasImage) {
    const message = await addMessage(thread.id, "bot", IMAGE_COPY, null);
    return {
      messages: message ? [message] : [],
      chips: [HUMAN_CHIP],
      aiEnabled: true,
      status: thread.status,
    };
  }

  const answer = engine.answer(input.body);

  if (answer.escalate) return handOff(thread);

  if (answer.miss) {
    const message = await addMessage(
      thread.id,
      "bot",
      "That one isn't in our shop information yet. Try asking about custom art, pricing, delivery or an order — or ask for a person and I'll hand you over.",
      null
    );
    return {
      messages: message ? [message] : [],
      chips: [HUMAN_CHIP, ...SUPPORT_OPENERS.slice(0, 3)],
      aiEnabled: true,
      status: thread.status,
    };
  }

  const message = await addMessage(thread.id, "bot", answer.text, null);
  return {
    messages: message ? [message] : [],
    chips: answer.chips,
    aiEnabled: true,
    status: thread.status,
  };
}

export async function uploadImage(threadId: string, file: File): Promise<string | null> {
  if (file.size > MAX_IMAGE_BYTES) return null;
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return null;

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${threadId}/${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from(SUPPORT_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return null;
  return path;
}
