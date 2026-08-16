import { ROSTER_CSV_HEADERS } from "@/constants/roster";
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

/** Case-insensitive name / email / seat filter for the roster search box. */
export function filterRoster(entries: RosterEntry[], query: string): RosterEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) ||
      entry.email.toLowerCase().includes(needle) ||
      (entry.seat?.seatId ?? "").toLowerCase() === needle,
  );
}

/** Headline counts for the roster stat row. */
export interface RosterSummary {
  registered: number;
  checkedIn: number;
  online: number;
  /** Attendees who have a Lecture Theatre seat tagged to them. */
  seated: number;
}

export function summarizeRoster(entries: RosterEntry[]): RosterSummary {
  return {
    registered: entries.length,
    checkedIn: entries.filter((entry) => entry.checkedInAt !== null).length,
    online: entries.filter((entry) => entry.online).length,
    seated: entries.filter((entry) => Boolean(entry.seat?.seatId)).length,
  };
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
      formatGoalsLabel(entry.goals),
      entry.registeredAt,
      entry.checkedInAt,
      entry.score,
    ]),
  );
}
