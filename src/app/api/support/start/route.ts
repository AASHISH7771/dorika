import { NextResponse, type NextRequest } from "next/server";
import { rateLimit, getClientIp } from "@/lib/security";
import {
  cleanName,
  createThread,
  isMissingTable,
  SUPPORT_OPENERS,
} from "@/lib/support/chat-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Opens a conversation. Returns the thread id and the token the browser must
 * present on every later call — the token is the only thing standing between
 * a stranger and someone else's transcript, so it is generated here and never
 * appears in any list.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`support:start:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = cleanName(payload.name);
  if (name.length < 2) {
    return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  }

  try {
    const { thread, greeting } = await createThread(name);
    return NextResponse.json({
      id: thread.id,
      token: thread.token,
      name: thread.visitor_name,
      status: thread.status,
      aiEnabled: thread.ai_enabled,
      messages: greeting,
      chips: SUPPORT_OPENERS.slice(0, 4),
    });
  } catch (error) {
    // The migration has not been run. The widget falls back to answering on
    // its own rather than showing the visitor a broken box.
    if (isMissingTable(error as { code?: string })) {
      return NextResponse.json({ error: "unavailable" }, { status: 503 });
    }
    console.error("[support/start]", error);
    return NextResponse.json({ error: "Could not start a chat." }, { status: 500 });
  }
}
