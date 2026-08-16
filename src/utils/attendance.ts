import {
  ATTENDEE_ROLE_LABEL,
  ATTENDEE_ROLE_ORDER,
  AttendeeRole,
  DEFAULT_ATTENDEE_ROLE,
} from "@/constants/seating";
import { ATTENDANCE_IMPORT_MAX_ROWS } from "@/constants/attendance";
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
 * Parse an attendance CSV: `Name, Email, Seat, Role` — a header row is
 * optional, and Seat/Role may be blank (unplaced attendee, defaulting to
 * Staff). Invalid rows are reported rather than silently dropped.
 */
export function parseAttendanceCsv(text: string): AttendanceParseResult {
  const table = parseCsv(text);
  const rows: AttendanceImportRow[] = [];
  const errors: string[] = [];
  const seenEmails = new Set<string>();

  for (const [index, cells] of table.entries()) {
    const [rawName = "", rawEmail = "", rawSeat = "", rawRole = ""] = cells.map((cell) =>
      cell.trim(),
    );

    // Skip a header row (detected, not assumed by position).
    if (index === 0 && rawEmail.toLowerCase() === "email") continue;

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
