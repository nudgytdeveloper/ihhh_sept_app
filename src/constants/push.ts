import { APP_SHORT_NAME, EVENT_NAME } from "@/constants/app";

/**
 * Web Push / PWA notifications (Nov event — "phone notifications for next event
 * timelines"). Attendees opt in; the host's reminders and event-journey phase
 * changes then arrive as a real phone notification even when the app is closed.
 *
 * Transport is the browser-native Push API + a VAPID keypair (server-only
 * private key). Delivery is handled by `web-push` in `src/server/push/send.ts`;
 * the service worker `public/sw.js` shows the notification. No third-party push
 * service — it runs on the same single Render web service as the SSE hub.
 */

/** How the notifications opt-in currently stands on this device. */
export enum PushStatus {
  /** Still resolving on mount (support + existing subscription unknown). */
  Unknown = "unknown",
  /** This browser can't do Web Push (e.g. iOS Safari before "Add to Home Screen"). */
  Unsupported = "unsupported",
  /** The server has no VAPID keys configured (push switched off server-side). */
  Unconfigured = "unconfigured",
  /** The attendee blocked notifications in the browser. */
  Blocked = "blocked",
  /** Supported + configured, but not subscribed yet. */
  Off = "off",
  /** Subscribed — phone alerts are on. */
  On = "on",
}

/** Browser Notification permission states (avoid raw string compares). */
export enum NotificationPermissionState {
  Default = "default",
  Granted = "granted",
  Denied = "denied",
}

/** API + asset paths for the push feature. */
export const PUSH_API_PATH = "/api/push";
export const PUSH_SUBSCRIBE_PATH = "/api/push/subscribe";
export const PUSH_UNSUBSCRIBE_PATH = "/api/push/unsubscribe";
export const SERVICE_WORKER_PATH = "/sw.js";
export const SERVICE_WORKER_SCOPE = "/";

/** Server-only VAPID env var names (never expose the private key). */
export const VAPID_ENV = {
  publicKey: "VAPID_PUBLIC_KEY",
  privateKey: "VAPID_PRIVATE_KEY",
  subject: "VAPID_SUBJECT",
} as const;

/** Notification presentation defaults (icons live in `public/`). */
export const PUSH_NOTIFICATION = {
  icon: "/icon-192.png",
  badge: "/badge-72.png",
  /** Fallback deep-link when a notification is tapped. */
  defaultUrl: "/",
  /** mailto: used for VAPID if `VAPID_SUBJECT` is unset. */
  subjectFallback: "mailto:events@ihhh2026.example",
} as const;

/**
 * Notification `tag`s — a new notification with the same tag replaces the older
 * one (so successive phase updates don't stack on the lock screen). Reminders
 * use their own reminder id as the tag.
 */
export enum PushTag {
  Phase = "ihhh-phase",
  Welcome = "ihhh-welcome",
}

/** Copy for the confirmation push sent right after an attendee opts in. */
export const PUSH_WELCOME = {
  title: `You're all set for ${EVENT_NAME} 🔔`,
  body: `${APP_SHORT_NAME} will ping you when it's game time, buffet, or your next session — even with the app closed.`,
} as const;

/** Title prefix for an event-journey ("what's next") push. */
export const PUSH_PHASE_TITLE_PREFIX = "Up next";
