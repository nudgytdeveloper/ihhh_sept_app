/**
 * Per-device attendee identity. Every attendee's browser persists a stable id, a
 * display name (entered at the welcome step, or a friendly auto handle until
 * then), an auto-allocated seat, and an onboarded flag — see
 * `@/utils/player-identity`. The same identity drives the navigator persona
 * (name + seat) and the shared live leaderboard handle.
 */

/** localStorage keys for the persisted attendee identity. */
export const PLAYER_STORAGE_KEYS = {
  id: "ihhh:player-id",
  name: "ihhh:player-name",
  seat: "ihhh:player-seat",
  onboarded: "ihhh:player-onboarded",
} as const;

/** Persisted-flag value for a completed welcome (entered their name). */
export const ONBOARDED_FLAG = "true";

/** Seat zones an attendee can be auto-allocated into. */
export const SEAT_ZONES: readonly string[] = ["Zone A", "Zone B", "Zone C", "Zone D"] as const;
/** Tables per zone + seats per table — the auto-allocation pool. */
export const SEAT_TABLE_COUNT = 12;
export const SEAT_SEATS_PER_TABLE = 10;

/** SSR-safe placeholder shown until the real identity loads on the client. */
export const PLAYER_NAME_FALLBACK = "Player";

/** Handle word pools — combined into e.g. "Swift Otter" (playful, on-brand). */
export const PLAYER_NAME_ADJECTIVES: readonly string[] = [
  "Swift",
  "Brave",
  "Sunny",
  "Mighty",
  "Zen",
  "Turbo",
  "Lucky",
  "Cosmic",
  "Breezy",
  "Jolly",
  "Nimble",
  "Witty",
] as const;

export const PLAYER_NAME_ANIMALS: readonly string[] = [
  "Otter",
  "Panda",
  "Falcon",
  "Koala",
  "Tiger",
  "Dolphin",
  "Fox",
  "Lynx",
  "Heron",
  "Bison",
  "Gecko",
  "Sparrow",
] as const;
