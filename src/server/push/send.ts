import webpush, { WebPushError } from "web-push";
import { getDb } from "@/server/db";
import {
  deletePushSubscription,
  listPushSubscriptions,
  listPushSubscriptionsForAttendee,
} from "@/server/db/push-subscriptions";
import { PUSH_NOTIFICATION, PUSH_PHASE_TITLE_PREFIX, PushTag, VAPID_ENV } from "@/constants/push";
import { HOST_REMINDERS } from "@/constants/host";
import { PHASE_META, EventPhase } from "@/constants/phases";
import { ROUTES } from "@/constants/routes";
import type { Db } from "@/server/db";
import type { PushSubscriptionRow } from "@/server/db/schema";
import type { NotificationPayload } from "@/types";

/**
 * Web Push delivery (server-only, Phase 5). Encrypts + signs each notification
 * with the VAPID keypair via `web-push` and POSTs it to every subscribed
 * device's push service. Fire-and-forget from the publish route — the live SSE
 * fan-out never waits on (or fails with) push. No VAPID keys ⇒ a no-op (the
 * feature is simply "not switched on", mirroring the voice/summary routes).
 *
 * `web-push` (not a hand-rolled fetch like the other providers) because Web Push
 * is a crypto protocol — aes128gcm payload encryption (ECDH P-256 + HKDF) plus a
 * VAPID ES256 JWT — where a battle-tested library beats bespoke crypto.
 */

const publicKey = process.env[VAPID_ENV.publicKey];
const privateKey = process.env[VAPID_ENV.privateKey];
const subject = process.env[VAPID_ENV.subject] || PUSH_NOTIFICATION.subjectFallback;

let vapidReady = false;

/** Whether push is switched on server-side (both VAPID keys present). */
export function isPushConfigured(): boolean {
  return Boolean(publicKey && privateKey);
}

/** The VAPID public key the client needs to subscribe (null when unconfigured). */
export function getPushPublicKey(): string | null {
  return publicKey ?? null;
}

/** Configure `web-push` with the VAPID details once (idempotent). */
function ensureVapid(): boolean {
  if (!isPushConfigured()) return false;
  if (!vapidReady) {
    webpush.setVapidDetails(subject, publicKey!, privateKey!);
    vapidReady = true;
  }
  return true;
}

/** Send one payload to one device; prune the row if the service says it's gone. */
async function sendOne(
  db: Db,
  row: PushSubscriptionRow,
  payload: NotificationPayload,
): Promise<void> {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload),
    );
  } catch (error) {
    // 404/410 = the subscription is permanently gone (unsubscribed / expired) —
    // drop it so we stop trying. Other errors are transient; leave the row.
    const status = error instanceof WebPushError ? error.statusCode : 0;
    if (status === 404 || status === 410) {
      await deletePushSubscription(db, row.endpoint).catch(() => {});
    } else {
      console.error("push send failed", status || error);
    }
  }
}

/** Broadcast a notification to every subscribed device (no-op with no DB / no keys). */
export async function sendPushToAll(payload: NotificationPayload): Promise<void> {
  const db = getDb();
  if (!db || !ensureVapid()) return;
  const rows = await listPushSubscriptions(db);
  await Promise.all(rows.map((row) => sendOne(db, row, payload)));
}

/** Send a notification to one attendee's devices (used for the opt-in confirmation). */
export async function sendPushToAttendee(
  attendeeId: string,
  payload: NotificationPayload,
): Promise<void> {
  const db = getDb();
  if (!db || !ensureVapid()) return;
  const rows = await listPushSubscriptionsForAttendee(db, attendeeId);
  await Promise.all(rows.map((row) => sendOne(db, row, payload)));
}

/**
 * The host advanced the event journey → push "what's next" to every phone
 * (the "phone notifications for next event timelines" requirement). Leads with
 * the time and deep-links to the schedule.
 */
export async function sendPhasePush(phase: EventPhase): Promise<void> {
  const meta = PHASE_META[phase];
  if (!meta) return;
  await sendPushToAll({
    title: `${PUSH_PHASE_TITLE_PREFIX}: ${meta.label}`,
    body: `${meta.time} · ${meta.description}`,
    url: ROUTES.SCHEDULE,
    tag: PushTag.Phase,
    icon: PUSH_NOTIFICATION.icon,
  });
}

/** The host pushed a one-off reminder → deliver it to every phone. */
export async function sendReminderPush(reminderId: string): Promise<void> {
  const reminder = HOST_REMINDERS.find((item) => item.id === reminderId);
  if (!reminder) return;
  await sendPushToAll({
    title: reminder.label,
    body: reminder.detail,
    url: PUSH_NOTIFICATION.defaultUrl,
    tag: reminder.id,
    icon: PUSH_NOTIFICATION.icon,
  });
}
