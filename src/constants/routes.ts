/**
 * Canonical route paths for the 5 demo screens.
 * Use ROUTES.* everywhere instead of hardcoded path strings.
 */

export const ROUTES = {
  /** Screen 1 — Attendee Navigator Home */
  HOME: "/",
  /** Screen 2 — Event Schedule / Phase Timeline */
  SCHEDULE: "/schedule",
  /** Screen 3 — Game Lobby */
  GAME_LOBBY: "/game/lobby",
  /** Screen 4 — Virus Fight Game */
  GAME_PLAY: "/game/play",
  /** Screen 5 — Host Game Control Panel */
  HOST: "/host",
  /** Host roster / attendance list (Nov-event Phase 2) */
  HOST_ROSTER: "/host/roster",
  /** Host speaker sessions / transcripts (Nov-event Phase 3) */
  HOST_SESSIONS: "/host/sessions",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
