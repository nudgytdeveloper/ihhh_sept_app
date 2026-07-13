import { isHostAuthRequired, isValidHostToken } from "@/server/host-auth";
import { checkRateLimit, getClientId, rateLimitResponse } from "@/server/rate-limit";
import { RateLimitBucket } from "@/constants/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Whether the host control room requires a passcode (so the client shows the gate). */
export async function GET() {
  return Response.json({ required: isHostAuthRequired() });
}

/** Validate a passcode. Rate-limited to slow brute-forcing. Never echoes the token. */
export async function POST(request: Request) {
  const limit = checkRateLimit(RateLimitBucket.HostVerify, getClientId(request));
  if (!limit.ok) return rateLimitResponse(limit);

  const body = (await request.json().catch(() => null)) as { token?: unknown } | null;
  const token = typeof body?.token === "string" ? body.token : "";
  return Response.json({ ok: isValidHostToken(token) });
}
