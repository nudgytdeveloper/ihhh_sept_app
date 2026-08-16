"use client";

import {
  ATTENDANCE_IMPORT_MAX_ROWS,
  ATTENDANCE_XLSX_EXTENSION,
} from "@/constants/attendance";
import { parseAttendanceTable, type AttendanceParseResult } from "@/utils/attendance";
import { parseCsv } from "@/utils/csv";

/**
 * Read an attendance list the host picked in the roster console — either a CSV
 * or the `.xlsx` IHH actually sends. Both end up in the same
 * `parseAttendanceTable`, so column matching, validation and error reporting
 * are identical whichever format arrives.
 *
 * The Excel reader is **dynamically imported** so its parser only loads when
 * someone actually picks a spreadsheet, and never lands in the attendee bundle.
 */
export function isExcelFile(file: File): boolean {
  return file.name.toLowerCase().endsWith(ATTENDANCE_XLSX_EXTENSION);
}

export async function parseAttendanceFile(file: File): Promise<AttendanceParseResult> {
  if (!isExcelFile(file)) return parseAttendanceTable(parseCsv(await file.text()));

  try {
    // `/browser` is the entry point for a File picked in the host console;
    // `readSheet` returns the first sheet's rows (the default export returns
    // every sheet wrapped, which we don't need — the list is one tab).
    const { readSheet } = await import("read-excel-file/browser");
    const rows = await readSheet(file);
    // Cells arrive typed (number / Date / boolean) — the parser wants text, and
    // a seat like "H2" or a role is a string in every case that matters.
    return parseAttendanceTable(
      rows.slice(0, ATTENDANCE_IMPORT_MAX_ROWS + 1).map((row) => row.map(toCellText)),
    );
  } catch {
    return {
      rows: [],
      errors: [`Couldn't read ${file.name} — is it a valid .xlsx workbook?`],
    };
  }
}

/** Excel cells arrive as string | number | boolean | Date | null. */
function toCellText(cell: unknown): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString();
  return String(cell);
}
