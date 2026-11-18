import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight keep-alive endpoint.
 *
 * The production host spins a free instance down after 15 minutes with no
 * inbound traffic, then takes roughly a minute to boot on the next request.
 * Point an uptime monitor (UptimeRobot, cron-job.org, BetterStack, etc.) at
 * this URL every 10-14 minutes to keep the container warm.
 *
 * Deliberately does no database work and no rendering, so the ping costs
 * almost nothing — unlike pinging "/" which would render the storefront.
 */
export function GET() {
  return NextResponse.json(
    { ok: true, service: "dorika", ts: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}
