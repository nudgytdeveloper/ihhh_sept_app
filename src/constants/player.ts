/**
 * Per-device player identity for the shared live leaderboard. Every attendee's
 * browser persists a stable id + a friendly auto-generated handle (so the board
 * shows distinct names across phones) — see `@/utils/player-identity`.
 */

/** localStorage keys for the persisted player identity. */
export const PLAYER_STORAGE_KEYS = {
  id: "ihhh:player-id",
  name: "ihhh:player-name",
} as const;

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
