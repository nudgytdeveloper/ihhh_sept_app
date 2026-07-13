/**
 * Tiny CSV helpers (no dependency): build a spreadsheet-safe CSV string and
 * trigger a browser download. Used by the host roster's attendance export.
 */

/** Quote/escape one CSV cell (commas, quotes, newlines). */
export function toCsvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** Build a CSV document from a header row + data rows. */
export function buildCsv(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | null | undefined>>,
): string {
  const lines = [headers, ...rows].map((row) => row.map(toCsvCell).join(","));
  return lines.join("\r\n");
}

/** Trigger a client-side download of a CSV document. */
export function downloadCsv(filename: string, csv: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
