import { RATE_LIMITS, RateLimitBucket } from "@/constants/rate-limit";

/**
 * In-memory fixed-window rate limiter (server-only, Phase 6). Keyed by
 * `bucket:clientIp`. Single-instance — fine for one Render web service; swap the
 * Map for Redis if scaled out. Never imported by client code.
 */

interface Window {
  count: number;
  resetAt: number;
}

const windows = new Map<string, Window>();

export interface RateLimitResult {
  ok: boolean;
  retryAfterSeconds: number;
}

/** The client's IP as seen through Render's proxy (falls back to a shared key). */
export function getClientId(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/** Count one request against a bucket for a client; reports whether it's allowed. */
export function checkRateLimit(bucket: RateLimitBucket, clientId: string): RateLimitResult {
  const rule = RATE_LIMITS[bucket];
  const key = `${bucket}:${clientId}`;
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + rule.windowMs });
    // Opportunistic sweep of expired windows so the Map can't grow unbounded.
    if (windows.size > 5_000) {
      for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
    }
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (current.count >= rule.limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
  }

  current.count += 1;
  return { ok: true, retryAfterSeconds: 0 };
}

/** Standard 429 response with a Retry-After header. */
export function rateLimitResponse(result: RateLimitResult): Response {
  return Response.json(
    { ok: false, error: "rate limited" },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
