import { RealtimeMessage } from "@/constants/realtime";

/**
 * Host control-room access (Nov-event Phase 6 hardening). A server-only
 * `HOST_TOKEN` gates the host: only a device that has entered the passcode may
 * drive the event (phase / reminders / game state / countdown) — and, crucially,
 * fan a push notification out to every phone. Attendees can still post their own
 * score without it. When `HOST_TOKEN` is unset the control room is open (local
 * dev / trusted demo).
 */

/** Header the host device sends its passcode in on publish + verify requests. */
export const HOST_TOKEN_HEADER = "x-host-token";

/** localStorage key holding the verified host passcode on the host device. */
export const HOST_TOKEN_STORAGE_KEY = "ihhh:host-token";

/** Endpoint: GET → whether a token is required; POST {token} → whether it's valid. */
export const HOST_VERIFY_PATH = "/api/host/verify";

/**
 * Realtime message types only the host may publish. A score (attendee → server)
 * is deliberately absent, so attendees never need the passcode.
 */
export const HOST_ONLY_MESSAGE_TYPES: readonly RealtimeMessage[] = [
  RealtimeMessage.State,
  RealtimeMessage.Reminder,
  RealtimeMessage.Phase,
  RealtimeMessage.Countdown,
];

/** Where the host device stands with respect to the control-room gate. */
export enum HostAuthStatus {
  /** Still checking whether a passcode is required. */
  Unknown = "unknown",
  /** No `HOST_TOKEN` configured server-side — the control room is open. */
  Open = "open",
  /** A passcode is required and hasn't been entered/validated yet. */
  Locked = "locked",
  /** A valid passcode has been entered on this device. */
  Unlocked = "unlocked",
}
