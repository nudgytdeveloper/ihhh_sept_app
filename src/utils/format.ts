/** Reusable formatting helpers (global rule: centralize shared functions here). */

/** Format a number of seconds as `mm:ss` (e.g. 65 → "01:05"). */
export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** Format a score with thousands separators (e.g. 12500 → "12,500"). */
export function formatScore(score: number): string {
  return score.toLocaleString("en-US");
}

/** Short local clock time for an ISO timestamp, e.g. "9:41 AM" ("" if invalid). */
export function formatClockTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Derive up-to-two-letter initials from a name (e.g. "Ada Lovelace" → "AL"). */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Fill `{token}` placeholders in a string from a vars map.
 * Used to personalize avatar script copy, e.g. template(msg, { name: "Ada" }).
 */
export function template(input: string, vars: Record<string, string>): string {
  return input.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in vars ? vars[key] : match,
  );
}
