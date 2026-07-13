/**
 * Host roster / attendance screen (Nov-event Phase 2).
 */

export const ROSTER_API_PATH = "/api/roster";

/** How often the roster screen re-fetches (ms) — keeps scores/check-ins fresh. */
export const ROSTER_REFRESH_MS = 15_000;

/** Download name for the attendance CSV export. */
export const ROSTER_CSV_FILENAME = "ihhh-attendance.csv";

/** Column headers of the attendance CSV export (order matters). */
export const ROSTER_CSV_HEADERS = [
  "Name",
  "Email",
  "Seat",
  "Learning goals",
  "Registered at",
  "Checked in at",
  "Best score",
] as const;
