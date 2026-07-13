import { RECORDING_CONFIG, SESSION_LIMITS, SessionStatus } from "@/constants/sessions";

/**
 * Speaker-session helpers (Phase 3): input sanitizing shared by the host UI and
 * the `/api/sessions` route, plus recording/transcript utilities. Isomorphic —
 * the `MediaRecorder` reference in `pickRecordingMime` is inside the function
 * body, so this module is safe to import server-side.
 */

/** Trim + clamp a session title to its limit. */
export function sanitizeTitle(raw: string): string {
  return raw.trim().slice(0, SESSION_LIMITS.titleMax);
}

/** Trim + clamp a speaker name to its limit. */
export function sanitizeSpeaker(raw: string): string {
  return raw.trim().slice(0, SESSION_LIMITS.speakerMax);
}

/** Clamp a transcript to its hard cap (defense against a runaway append). */
export function sanitizeTranscript(raw: string): string {
  return raw.slice(0, SESSION_LIMITS.transcriptMax);
}

/** A session needs both a title and a speaker before it can be created. */
export function isValidSessionInput(title: string, speaker: string): boolean {
  return title.trim().length > 0 && speaker.trim().length > 0;
}

/** Type guard: is `value` one of the SessionStatus enum values? */
export function isSessionStatus(value: unknown): value is SessionStatus {
  return (
    typeof value === "string" &&
    (Object.values(SessionStatus) as string[]).includes(value)
  );
}

/**
 * Append a freshly-transcribed segment to the running transcript, separating
 * with a single space and collapsing stray whitespace. Empty segments are
 * ignored (near-silence returns nothing from Scribe).
 */
export function appendSegment(existing: string, segment: string): string {
  const clean = segment.trim().replace(/\s+/g, " ");
  if (!clean) return existing;
  return existing ? `${existing} ${clean}` : clean;
}

/** Word count for a transcript (0 for empty/whitespace). */
export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * The best MediaRecorder mime type this browser supports, or null if none of
 * the candidates work (recording unavailable). Browser-only — call from a
 * client component.
 */
export function pickRecordingMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of RECORDING_CONFIG.mimeCandidates) {
    if (MediaRecorder.isTypeSupported(mime)) return mime;
  }
  return null;
}
