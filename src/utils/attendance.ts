import {
  ATTENDEE_ROLE_LABEL,
  ATTENDEE_ROLE_ORDER,
  AttendeeRole,
  DEFAULT_ATTENDEE_ROLE,
} from "@/constants/seating";
import {
  ATTENDANCE_COLUMN_ALIASES,
  ATTENDANCE_IMPORT_MAX_ROWS,
  type AttendanceColumn,
} from "@/constants/attendance";
import { parseCsv } from "@/utils/csv";
import { isAssignableSeatId, normalizeSeatId } from "@/utils/seats";
import { isValidEmail, normalizeEmail } from "@/utils/registration";
import type { AttendanceImportRow, RosterEntry } from "@/types";

/**
 * Attendance-list helpers: role parsing, CSV import validation, and the
 * duplicate-seat check the host console warns on. Shared by the roster screen
 * and the import API route, so both agree on what a valid row is.
 */

export function isAttendeeRole(value: string): value is AttendeeRole {
  return ATTENDEE_ROLE_ORDER.includes(value as AttendeeRole);
}

/** Accepts the enum value or the display label ("HOD", "Supervisor", …). */
export function parseRole(value: string | null | undefined): AttendeeRole {
  const needle = (value ?? "").trim().toLowerCase();
  if (!needle) return DEFAULT_ATTENDEE_ROLE;
  if (isAttendeeRole(needle)) return needle;
  const matched = ATTENDEE_ROLE_ORDER.find(
    (role) => ATTENDEE_ROLE_LABEL[role].toLowerCase() === needle,
  );
  return matched ?? DEFAULT_ATTENDEE_ROLE;
}

export function roleLabel(role: AttendeeRole): string {
  return ATTENDEE_ROLE_LABEL[role];
}

/** Seat ids held by more than one attendee — surfaced as a warning, not an error. */
export function duplicateSeatIds(entries: readonly RosterEntry[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const entry of entries) {
    const seatId = entry.seat?.seatId;
    if (!seatId) continue;
    if (seen.has(seatId)) duplicates.add(seatId);
    seen.add(seatId);
  }
  return [...duplicates];
}

export interface AttendanceParseResult {
  rows: AttendanceImportRow[];
  /** Rows that couldn't be imported, with the reason (shown to the host). */
  errors: string[];
}

/**
 * Which position each column sits in, read from the file's header row.
 * `null` when the file has no recognisable header — the caller then falls back
 * to the fixed `ATTENDANCE_IMPORT_HEADERS` order.
 */
export type AttendanceColumnMap = Record<AttendanceColumn, number>;

const COLUMN_ORDER: readonly AttendanceColumn[] = ["name", "email", "seat", "role"];

/**
 * Match a header row to columns by name, so a spreadsheet can label its seat
 * column "Seat Number" (as IHH's does) or order the columns however it likes.
 * Returns null unless both required columns (name + email) were found.
 */
export function resolveAttendanceColumns(cells: readonly string[]): AttendanceColumnMap | null {
  const map: AttendanceColumnMap = { name: -1, email: -1, seat: -1, role: -1 };
  cells.forEach((cell, index) => {
    const header = cell.trim().toLowerCase();
    if (!header) return;
    for (const column of COLUMN_ORDER) {
      const aliases: readonly string[] = ATTENDANCE_COLUMN_ALIASES[column];
      if (map[column] === -1 && aliases.includes(header)) map[column] = index;
    }
  });
  return map.name === -1 || map.email === -1 ? null : map;
}

/** Positional fallback for a file that ships no header row. */
const POSITIONAL_COLUMNS: AttendanceColumnMap = { name: 0, email: 1, seat: 2, role: 3 };

/**
 * Parse an attendance CSV: `Name, Email, Seat, Role`. See
 * `parseAttendanceTable` for the rules — this just splits the text first.
 */
export function parseAttendanceCsv(text: string): AttendanceParseResult {
  return parseAttendanceTable(parseCsv(text));
}

/**
 * Parse an already-split attendance table (CSV rows or Excel cells).
 *
 * Columns are matched by header name when the first row is a recognisable
 * header, otherwise by the fixed `Name, Email, Seat, Role` order. Seat and Role
 * may be blank (an unplaced attendee, defaulting to Staff). Invalid rows are
 * reported rather than silently dropped, so the host sees what didn't make it.
 */
export function parseAttendanceTable(table: readonly string[][]): AttendanceParseResult {
  const rows: AttendanceImportRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  const header = table[0] ? resolveAttendanceColumns(table[0]) : null;
  const columns = header ?? POSITIONAL_COLUMNS;

  for (const [index, cells] of table.entries()) {
    // Skip the header row (detected, not assumed by position).
    if (index === 0 && header) continue;

    const cellAt = (column: AttendanceColumn) => {
      const position = columns[column];
      return position === -1 ? "" : (cells[position] ?? "").trim();
    };
    const rawName = cellAt("name");
    const rawEmail = cellAt("email");
    const rawSeat = cellAt("seat");
    const rawRole = cellAt("role");

    // A headerless file still shouldn't import its own header row.
    if (index === 0 && !header && rawEmail.toLowerCase() === "email") continue;
    // Trailing blank rows are common in spreadsheets — ignore, don't report.
    if (!rawName && !rawEmail) continue;

    const line = index + 1;
    const name = rawName;
    const email = normalizeEmail(rawEmail);

    if (!name) {
      errors.push(`Line ${line}: missing name`);
      continue;
    }
    if (!isValidEmail(email)) {
      errors.push(`Line ${line}: "${rawEmail}" is not a valid email`);
      continue;
    }
    if (seenEmails.has(email)) {
      errors.push(`Line ${line}: ${email} appears more than once`);
      continue;
    }

    let seatId = "";
    if (rawSeat) {
      seatId = normalizeSeatId(rawSeat);
      if (!isAssignableSeatId(seatId)) {
        errors.push(`Line ${line}: "${rawSeat}" is not a seat in this theatre`);
        continue;
      }
    }

    seenEmails.add(email);
    rows.push({ name, email, seatId, role: parseRole(rawRole) });

    if (rows.length >= ATTENDANCE_IMPORT_MAX_ROWS) {
      errors.push(`Stopped at ${ATTENDANCE_IMPORT_MAX_ROWS} rows — split the file.`);
      break;
    }
  }

  return { rows, errors };
}

/** Validate rows arriving at the import API (same rules, already-parsed data). */
export function sanitizeAttendanceRows(input: unknown): AttendanceImportRow[] | null {
  if (!Array.isArray(input) || input.length === 0) return null;
  if (input.length > ATTENDANCE_IMPORT_MAX_ROWS) return null;

  const rows: AttendanceImportRow[] = [];
  for (const raw of input) {
    if (typeof raw !== "object" || raw === null) return null;
    const { name, email, seatId, role } = raw as Record<string, unknown>;
    if (typeof name !== "string" || !name.trim()) return null;
    if (typeof email !== "string" || !isValidEmail(email)) return null;
    const seat = typeof seatId === "string" && seatId ? normalizeSeatId(seatId) : "";
    if (seat && !isAssignableSeatId(seat)) return null;
    rows.push({
      name: name.trim(),
      email: normalizeEmail(email),
      seatId: seat,
      role: parseRole(typeof role === "string" ? role : undefined),
    });
  }
  return rows;
}
