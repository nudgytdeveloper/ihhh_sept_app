import {
  ROSTER_CSV_HEADERS,
  ROSTER_STATUS_LABEL,
  RosterFilter,
} from "@/constants/roster";
import { buildCsv } from "@/utils/csv";
import { roleLabel } from "@/utils/attendance";
import { seatLabel } from "@/utils/seats";
import type { LearningGoals, RosterEntry, SeatInfo } from "@/types";

/**
 * Host roster helpers: shaping/filters for the attendance screen + the CSV
 * export. Client-safe (also usable server-side).
 */

/** "Row H · Seat H3", or "" when the attendee hasn't been placed yet. */
export function formatSeatLabel(seat: SeatInfo | null): string {
  return seatLabel(seat);
}

/** All goals as one readable line: preset picks first, then the custom goal. */
export function formatGoalsLabel(goals: LearningGoals): string {
  return [...goals.selected, goals.custom.trim()].filter(Boolean).join("; ");
}

/** Short local time for a roster timestamp, e.g. "9:41 AM" ("" when null). */
export function formatRosterTime(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/**
 * Has this person actually signed into the app? False means they're on the
 * uploaded attendance list but have never registered — the list the
 * registration desk works through.
 */
export function isRegistered(entry: RosterEntry): boolean {
  return entry.registeredAt !== null;
}

/** Matches the roster status filter chips. */
function matchesFilter(entry: RosterEntry, filter: RosterFilter): boolean {
  switch (filter) {
    case RosterFilter.Registered:
      return isRegistered(entry);
    case RosterFilter.NotRegistered:
      return !isRegistered(entry);
    case RosterFilter.All:
      return true;
  }
}

/** Roster search box (name / email / seat) combined with the status filter. */
export function filterRoster(
  entries: RosterEntry[],
  query: string,
  filter: RosterFilter = RosterFilter.All,
): RosterEntry[] {
  const needle = query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (!matchesFilter(entry, filter)) return false;
    if (!needle) return true;
    return (
      entry.name.toLowerCase().includes(needle) ||
      entry.email.toLowerCase().includes(needle) ||
      (entry.seat?.seatId ?? "").toLowerCase() === needle
    );
  });
}

/** Headline counts for the roster stat row. */
export interface RosterSummary {
  /** Everyone on the attendance list, registered or not. */
  onList: number;
  registered: number;
  /** On the list but hasn't signed into the app yet. */
  notRegistered: number;
  checkedIn: number;
  online: number;
  /** Attendees who have a Lecture Theatre seat tagged to them. */
  seated: number;
}

export function summarizeRoster(entries: RosterEntry[]): RosterSummary {
  const registered = entries.filter(isRegistered).length;
  return {
    onList: entries.length,
    registered,
    notRegistered: entries.length - registered,
    checkedIn: entries.filter((entry) => entry.checkedInAt !== null).length,
    online: entries.filter((entry) => entry.online).length,
    seated: entries.filter((entry) => Boolean(entry.seat?.seatId)).length,
  };
}

/** Count of each status filter, for the chip badges. */
export function countByFilter(entries: RosterEntry[], filter: RosterFilter): number {
  return entries.filter((entry) => matchesFilter(entry, filter)).length;
}

/**
 * The attendance CSV document for the current roster. Seat is written as the
 * bare id ("H3") so the export can be edited and imported straight back.
 */
export function rosterToCsv(entries: RosterEntry[]): string {
  return buildCsv(
    ROSTER_CSV_HEADERS,
    entries.map((entry) => [
      entry.name,
      entry.email,
      entry.seat?.seatId ?? "",
      roleLabel(entry.role),
      isRegistered(entry)
        ? ROSTER_STATUS_LABEL.registered
        : ROSTER_STATUS_LABEL.notRegistered,
      formatGoalsLabel(entry.goals),
      entry.registeredAt,
      entry.checkedInAt,
      entry.score,
    ]),
  );
}
