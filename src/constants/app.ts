/**
 * App-level identity & event metadata.
 * Centralized here so copy/branding lives in one place (see global rule:
 * no raw strings — reference these constants).
 */

export const APP_NAME = "Event Navigator";
export const APP_SHORT_NAME = "Navigator";
export const APP_TAGLINE =
  "Your personal host for the IHH SG Learning Festival — always one step ahead, guiding you through the day.";

/** The avatar host's friendly name (the proactive MC/guide). */
export const AVATAR_NAME = "Navi";

/** In-sentence form ("Welcome to {EVENT_NAME}"). */
export const EVENT_NAME = "IHH SG Learning Festival 2026";
/** Branded form, as IHH writes it — titles and headings. */
export const EVENT_FULL_NAME = "IHH SG LEARNING FESTIVAL 2026";
export const EVENT_DATE_ISO = "2026-09-02";
export const EVENT_DATE_LABEL = "2 September 2026";
/** The real venue — its seat plan geometry lives in `@/constants/seating`. */
export const EVENT_VENUE = "Gleneagles Hospital · Lecture Theatre";

/**
 * The event runs on Singapore time (UTC+8, no DST). Phase auto-advance keys off
 * this rather than the device clock, so an attendee travelling with their phone
 * on another timezone still sees the right phase.
 */
export const EVENT_TIMEZONE_OFFSET_MINUTES = 8 * 60;
export const EVENT_TIMEZONE_LABEL = "SGT (UTC+8)";
