// ─────────────────────────────────────────────────────────────
//  Spam protection: in-memory rate limiter + honeypot + Turnstile
//  (In-memory is fine for a single-region Vercel deploy / low volume.
//   Swap for Upstash Redis if you scale to many serverless regions.)
// ─────────────────────────────────────────────────────────────

type Bucket = { count: number; resetAt: number };
const store = new Map<string, Bucket>();

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds
}

/**
 * Fixed-window rate limit.
 * @param key   unique key (e.g. `contact:<ip>`)
 * @param limit max requests per window
 * @param windowMs window size in ms (default 60s)
 */
export function rateLimit(key: string, limit = 5, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = store.get(key);

  if (!bucket || now > bucket.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count, retryAfter: 0 };
}

// Best-effort client IP from request headers (Vercel / proxies)
export function getClientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}

/**
 * Honeypot: a hidden field that humans never fill. If present & non-empty,
 * silently treat as spam. Field name is deliberately tempting for bots.
 */
export const HONEYPOT_FIELD = "company_website";
export function isHoneypotTripped(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Verify a Cloudflare Turnstile token. If no secret is configured, we skip
 * (honeypot + rate-limit still protect the form).
 */
export async function verifyTurnstile(token: string | undefined, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // disabled → pass
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    });
    const data = (await res.json()) as { success: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}
