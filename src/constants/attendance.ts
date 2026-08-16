import { AttendeeRole } from "@/constants/seating";
import type { AttendanceImportRow } from "@/types";

/**
 * The attendance list IHH supplies before the event: name, corporate email and
 * the seat designated for that person (Notion task 561).
 *
 * This is the **seed** only. The host loads it into Postgres from the roster
 * console ("Load IHH list"), and from then on the database is the source of
 * truth — seats and roles are edited there, or replaced by a CSV import.
 *
 * An attendee who registers with an email on this list is matched to their
 * designated seat; anyone else is auto-allocated a free seat the host can
 * override.
 */
export const PRELOADED_ATTENDEES: readonly AttendanceImportRow[] = [
  {
    name: "Soh Poh Choo Mona",
    email: "mona.soh@parkwaycollege.sg",
    seatId: "H1",
    role: AttendeeRole.Staff,
  },
  {
    name: "Isabelle Wong Jia Ling",
    email: "jialing.wong@ihhhealthcare.com",
    seatId: "H2",
    role: AttendeeRole.Staff,
  },
  {
    name: "Andy Kok",
    email: "andy.kok@ihhhealthcare.com",
    seatId: "H3",
    role: AttendeeRole.Staff,
  },
  {
    name: "Desmond Goh",
    email: "desmond.goh@ihhhealthcare.com",
    seatId: "H4",
    role: AttendeeRole.Staff,
  },
  {
    name: "Bullecer Silahis Lao",
    email: "silahis.bullecer@ihhhealthcare.com",
    seatId: "H5",
    role: AttendeeRole.Staff,
  },
  {
    name: "Tan Ai Wei",
    email: "aiwei.tan@parkwaycollege.sg",
    seatId: "H6",
    role: AttendeeRole.Staff,
  },
  {
    name: "Jacqueline Tan Lee Lee",
    email: "jacq.tan@parkwaycollege.sg",
    seatId: "H7",
    role: AttendeeRole.Staff,
  },
  {
    name: "Ng Siew Hua Helen",
    email: "helen.ng@parkwaycollege.sg",
    seatId: "H8",
    role: AttendeeRole.Staff,
  },
  {
    name: "Tan Hui Ping, Connie",
    email: "connie.tan@parkwaycollege.sg",
    seatId: "K1",
    role: AttendeeRole.Staff,
  },
  {
    name: "Lee Yee Ren Marcus",
    email: "marcus.lee@ihhhealthcare.com",
    seatId: "K2",
    role: AttendeeRole.Staff,
  },
  {
    name: "Elin How Yi Ning",
    email: "elin.how@ihhhealthcare.com",
    seatId: "J1",
    role: AttendeeRole.Staff,
  },
  {
    name: "Lim Seok Bin Diana (Lin Shumin Diana)",
    email: "diana.lim@ihhhealthcare.com",
    seatId: "J2",
    role: AttendeeRole.Staff,
  },
] as const;

/** Column order accepted by the attendance import when there's no header row. */
export const ATTENDANCE_IMPORT_HEADERS = ["Name", "Email", "Seat", "Role"] as const;

/**
 * Header names recognised for each column, lowercased. IHH's spreadsheet calls
 * the seat column "Seat Number", so the importer matches columns **by header
 * name** and only falls back to the fixed order above when a file has no
 * recognisable header row. Add an alias here rather than asking the client to
 * rename their columns.
 */
export const ATTENDANCE_COLUMN_ALIASES = {
  name: ["name", "full name", "attendee", "attendee name", "staff name"],
  email: ["email", "email address", "e-mail", "corporate email", "work email"],
  seat: ["seat", "seat number", "seat no", "seat no.", "seat id", "seat #"],
  role: ["role", "designation", "type", "attendee type"],
} as const;

/** Which column an attendance file supplies in each position. */
export type AttendanceColumn = keyof typeof ATTENDANCE_COLUMN_ALIASES;

/** Import path + the largest list the host console will accept in one go. */
export const ATTENDANCE_IMPORT_API_PATH = "/api/roster/import";
export const ATTENDANCE_IMPORT_MAX_ROWS = 500;

/** File types the host console's attendance picker accepts. */
export const ATTENDANCE_XLSX_EXTENSION = ".xlsx";
export const ATTENDANCE_CSV_EXTENSION = ".csv";
export const ATTENDANCE_FILE_ACCEPT = [
  ATTENDANCE_CSV_EXTENSION,
  ATTENDANCE_XLSX_EXTENSION,
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");
