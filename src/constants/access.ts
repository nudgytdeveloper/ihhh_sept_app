/**
 * Access control for the attendee app (Notion follow-up to task 561).
 *
 * The event is invite-only: the attendance list IHH uploads **is** the
 * allowlist. An email that isn't on it can't register, so nobody outside the
 * Learning Festival can wander into the roster, the leaderboard or the recaps.
 *
 * Two deliberate escape hatches, both server-side:
 * - `DEV_ADMIN_EMAILS` — a comma-separated list of developer/admin addresses
 *   that always get in, so the app can be demoed or debugged without editing
 *   the client's list.
 * - An **empty** attendance list leaves registration open. A fresh deploy with
 *   nothing imported yet would otherwise lock every single person out,
 *   including the host who needs to import the list.
 */

/** Why a registration was refused — drives the copy the welcome gate shows. */
export enum AccessDenialReason {
  NotOnList = "not_on_list",
}

/** Env var holding the always-allowed developer/admin addresses (comma-separated). */
export const DEV_ADMIN_EMAILS_ENV = "DEV_ADMIN_EMAILS";

/** Separator used inside `DEV_ADMIN_EMAILS`. */
export const DEV_ADMIN_EMAILS_SEPARATOR = ",";

/** Copy shown when an email isn't on the attendance list. */
export const ACCESS_COPY = {
  notOnList:
    "That email isn't on the guest list for this event. Please use the corporate email your invite was sent to, or check with the registration desk.",
} as const;
