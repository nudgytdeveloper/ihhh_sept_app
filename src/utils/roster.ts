import { ROSTER_CSV_HEADERS } from "@/constants/roster";
import { buildCsv } from "@/utils/csv";
import type { LearningGoals, RosterEntry, SeatInfo } from "@/types";

/**
 * Host roster helpers: shaping/filters for the attendance screen + the CSV
 * export. Client-safe (also usable server-side).
 */

/** "Zone A · Table 3 · Seat 5" (only the parts that exist), or "" when unassigned. */
export function formatSeatLabel(seat: SeatInfo | null): string {
  if (!seat) return "";
  return [seat.zone, seat.table, seat.seat].filter(Boolean).join(" · ");
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

/** Case-insensitive name/email filter for the roster search box. */
export function filterRoster(entries: RosterEntry[], query: string): RosterEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter(
    (entry) =>
      entry.name.toLowerCase().includes(needle) ||
      entry.email.toLowerCase().includes(needle),
  );
}

/** Headline counts for the roster stat row. */
export interface RosterSummary {
  registered: number;
  checkedIn: number;
  online: number;
  played: number;
}

export function summarizeRoster(entries: RosterEntry[]): RosterSummary {
  return {
    registered: entries.length,
    checkedIn: entries.filter((entry) => entry.checkedInAt !== null).length,
    online: entries.filter((entry) => entry.online).length,
    played: entries.filter((entry) => entry.score !== null).length,
  };
}

/** The attendance CSV document for the current roster. */
export function rosterToCsv(entries: RosterEntry[]): string {
  return buildCsv(
    ROSTER_CSV_HEADERS,
    entries.map((entry) => [
      entry.name,
      entry.email,
      formatSeatLabel(entry.seat),
      formatGoalsLabel(entry.goals),
      entry.registeredAt,
      entry.checkedInAt,
      entry.score,
    ]),
  );
}
