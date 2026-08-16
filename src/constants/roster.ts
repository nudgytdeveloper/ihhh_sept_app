/**
 * Host roster / attendance screen (Nov-event Phase 2, extended with seat +
 * role tagging for the Lecture Theatre event).
 */

export const ROSTER_API_PATH = "/api/roster";

/** How often the roster screen re-fetches (ms) — keeps scores/check-ins fresh. */
export const ROSTER_REFRESH_MS = 15_000;

/** Download name for the attendance CSV export. */
export const ROSTER_CSV_FILENAME = "ihhh-attendance.csv";

/**
 * Column headers of the attendance CSV export (order matters). The first four
 * match `ATTENDANCE_IMPORT_HEADERS`, so an exported list can be edited in Excel
 * and imported straight back.
 */
export const ROSTER_CSV_HEADERS = [
  "Name",
  "Email",
  "Seat",
  "Role",
  "Status",
  "Learning goals",
  "Registered at",
  "Checked in at",
  "Best score",
] as const;

/**
 * Which slice of the attendance list the host is looking at. "Not registered"
 * is the one IHH asked for: everyone on the uploaded list who hasn't opened the
 * app yet, so the registration desk knows who to chase.
 */
export enum RosterFilter {
  All = "all",
  Registered = "registered",
  NotRegistered = "not_registered",
}

export const ROSTER_FILTER_ORDER: readonly RosterFilter[] = [
  RosterFilter.All,
  RosterFilter.Registered,
  RosterFilter.NotRegistered,
] as const;

export const ROSTER_FILTER_LABEL: Record<RosterFilter, string> = {
  [RosterFilter.All]: "Everyone",
  [RosterFilter.Registered]: "Registered",
  [RosterFilter.NotRegistered]: "Not yet registered",
};

/** Status wording used in the table badge and the CSV export. */
export const ROSTER_STATUS_LABEL = {
  registered: "Registered",
  notRegistered: "Not registered",
} as const;
