import { NextResponse, type NextRequest } from "next/server";
import { getThread, listMessages } from "@/lib/support/chat-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The widget's only read path. Returns messages newer than `after`, plus the
 * thread state, so a staff reply and a flip in `ai_enabled` both land without
 * a refresh. `after=0` replays the whole transcript, which is how a returning
 * visitor gets their conversation back.
 */
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const id = params.get("id") ?? "";
  const token = params.get("token") ?? "";
  const after = Number(params.get("after") ?? "0");

  const thread = await getThread(id, token);
  if (!thread) {
    return NextResponse.json({ error: "This chat has expired." }, { status: 403 });
  }

  const messages = await listMessages(
    thread.id,
    Number.isFinite(after) && after > 0 ? after : 0
  );

  return NextResponse.json({
    status: thread.status,
    aiEnabled: thread.ai_enabled,
    name: thread.visitor_name,
    messages,
  });
}
