import { getDb } from "@/server/db";
import { upsertPushSubscription } from "@/server/db/push-subscriptions";
import { sendPushToAttendee } from "@/server/push/send";
import { checkRateLimit, getClientId, rateLimitResponse } from "@/server/rate-limit";
import { PUSH_NOTIFICATION, PUSH_WELCOME, PushTag } from "@/constants/push";
import { RateLimitBucket } from "@/constants/rate-limit";
import type { PushSubscriptionInput } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Narrow an unknown JSON body to a valid push subscription (endpoint + keys + attendee). */
function parseSubscription(body: unknown): PushSubscriptionInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const keys = b.keys as Record<string, unknown> | undefined;
  if (
    typeof b.endpoint !== "string" ||
    typeof b.attendeeId !== "string" ||
    !b.attendeeId ||
    !keys ||
    typeof keys.p256dh !== "string" ||
    typeof keys.auth !== "string"
  ) {
    return null;
  }
  return {
    endpoint: b.endpoint,
    attendeeId: b.attendeeId,
    keys: { p256dh: keys.p256dh, auth: keys.auth },
  };
}

/**
 * An attendee opted into phone alerts: store their device's push subscription
 * and send a one-off confirmation notification so they see it working. Requires
 * the database (there's nothing to deliver to without a stored subscription).
 */
export async function POST(request: Request) {
  const limit = checkRateLimit(RateLimitBucket.PushSubscribe, getClientId(request));
  if (!limit.ok) return rateLimitResponse(limit);

  const sub = parseSubscription(await request.json().catch(() => null));
  if (!sub) {
    return Response.json({ ok: false, error: "invalid subscription" }, { status: 400 });
  }

  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "storage unavailable" }, { status: 503 });
  }

  await upsertPushSubscription(db, sub);

  // Confirmation push (fire-and-forget; no-op when VAPID isn't configured). The
  // row is committed above, so the sender will find it.
  void sendPushToAttendee(sub.attendeeId, {
    title: PUSH_WELCOME.title,
    body: PUSH_WELCOME.body,
    url: PUSH_NOTIFICATION.defaultUrl,
    tag: PushTag.Welcome,
    icon: PUSH_NOTIFICATION.icon,
  }).catch(() => {});

  return Response.json({ ok: true });
}
