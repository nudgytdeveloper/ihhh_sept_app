/**
 * Shared status enums. Per the global rule, never compare raw strings —
 * use these enums for attendee/seat status, avatar mood, and CTA intent.
 */

/** Whether the attendee has completed event check-in / registration. */
export enum RegistrationStatus {
  Incomplete = "incomplete",
  Complete = "complete",
}

/** Seat assignment state shown on the navigator home. */
export enum SeatStatus {
  Unassigned = "unassigned",
  Assigned = "assigned",
  Ready = "ready",
}

/**
 * Avatar expression/tone, used by the Avatar Script Engine to drive the
 * host's face/animation alongside each scripted line.
 */
export enum AvatarMood {
  Welcoming = "welcoming",
  Guiding = "guiding",
  Excited = "excited",
  Relaxed = "relaxed",
  Celebrating = "celebrating",
}

/** Visual weight for an avatar next-action CTA. */
export enum ActionIntent {
  Primary = "primary",
  Secondary = "secondary",
}
