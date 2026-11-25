import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/security";
import {
  addMessage,
  cleanBody,
  getThread,
  handOff,
  runAssistant,
  uploadImage,
  type ChatMessage,
} from "@/lib/support/chat-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Posts a visitor message, and the assistant's reply if the assistant is still
 * switched on for that thread.
 *
 * `escalate=1` means the visitor pressed "talk to a human": we record the
 * request, flip `ai_enabled` off, and from then on this route only ever
 * stores what the visitor types — it never generates another answer.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const id = String(form.get("id") ?? "");
  const token = String(form.get("token") ?? "");
  const escalate = String(form.get("escalate") ?? "") === "1";
  const body = cleanBody(form.get("body"));

  const rl = rateLimit(`support:send:${id || ip}`, 40, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Slow down a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const thread = await getThread(id, token);
  if (!thread) {
    return NextResponse.json({ error: "This chat has expired." }, { status: 403 });
  }
  if (thread.status === "closed") {
    return NextResponse.json({ error: "This chat is closed.", status: "closed", aiEnabled: false }, { status: 409 });
  }

  const file = form.get("image");
  const image = file instanceof File && file.size > 0 ? file : null;

  if (!body && !image && !escalate) {
    return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  }

  const out: ChatMessage[] = [];

  // ── handoff ────────────────────────────────────────────────
  if (escalate) {
    if (body) {
      const said = await addMessage(thread.id, "visitor", body, null);
      if (said) out.push(said);
    }
    const turn = await handOff(thread);
    out.push(...turn.messages);
    return NextResponse.json({
      status: turn.status,
      aiEnabled: turn.aiEnabled,
      messages: out,
      chips: turn.chips,
    });
  }

  // ── photo, if any ──────────────────────────────────────────
  let imagePath: string | null = null;
  let imageError = false;
  if (image) {
    imagePath = await uploadImage(thread.id, image);
    if (!imagePath) imageError = true;
  }

  if (!body && !imagePath) {
    return NextResponse.json(
      { error: imageError ? "That photo could not be uploaded." : "Nothing to send." },
      { status: imageError ? 502 : 400 }
    );
  }

  const said = await addMessage(thread.id, "visitor", body || null, imagePath);
  if (said) out.push(said);

  const turn = await runAssistant(thread, { body, hasImage: !!imagePath });
  out.push(...turn.messages);

  return NextResponse.json({
    status: turn.status,
    aiEnabled: turn.aiEnabled,
    messages: out,
    chips: turn.chips,
    imageError,
  });
}
