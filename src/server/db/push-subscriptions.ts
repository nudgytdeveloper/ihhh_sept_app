import { eq, sql } from "drizzle-orm";
import { pushSubscriptions } from "./schema";
import type { Db } from "./index";
import type { PushSubscriptionInput } from "@/types";

/**
 * Web Push subscriptions store (server-only, Phase 5). Keyed by the push service
 * `endpoint`; re-subscribing the same device upserts (keys can rotate). Stale
 * rows are pruned by `deletePushSubscription` when the push service 404/410s.
 */

/** Store (or refresh) a device's push subscription for an attendee. */
export async function upsertPushSubscription(
  db: Db,
  sub: PushSubscriptionInput,
): Promise<void> {
  await db
    .insert(pushSubscriptions)
    .values({
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      attendeeId: sub.attendeeId,
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        p256dh: sql`excluded.p256dh`,
        auth: sql`excluded.auth`,
        attendeeId: sql`excluded.attendee_id`,
      },
    });
}

/** Every stored subscription — the audience for a broadcast push. */
export function listPushSubscriptions(db: Db) {
  return db.select().from(pushSubscriptions);
}

/** One attendee's subscriptions (all their devices). */
export function listPushSubscriptionsForAttendee(db: Db, attendeeId: string) {
  return db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.attendeeId, attendeeId));
}

/** Remove a subscription (attendee opted out, or the push service reported it gone). */
export async function deletePushSubscription(db: Db, endpoint: string): Promise<void> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}
