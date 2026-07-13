import { EVENT_NAME } from "@/constants/app";
import { SessionStatus } from "@/constants/sessions";
import { WHATSAPP_SHARE } from "@/constants/summaries";
import type { Session, Summary } from "@/types";

/**
 * Helpers for the AI session recaps (Phase 4): which sessions can be
 * summarized, and building the WhatsApp share link.
 */

/** A session can be recapped once it's recorded and has a transcript. */
export function isSummarizable(session: Session): boolean {
  return session.status === SessionStatus.Ready && session.transcript.trim().length > 0;
}

/** Index an attendee's summaries by sessionId for quick lookup on /recaps. */
export function indexSummariesBySession(summaries: Summary[]): Map<string, Summary> {
  const map = new Map<string, Summary>();
  for (const summary of summaries) map.set(summary.sessionId, summary);
  return map;
}

/**
 * A `wa.me/?text=` "click to chat" link that opens WhatsApp with the recap
 * pre-filled (attendee picks the recipient — no WhatsApp API, no number). Text
 * is capped well under URL limits.
 */
export function buildWhatsAppShareUrl(session: Session, content: string): string {
  const header = `${session.title} — ${session.speaker}\n${EVENT_NAME} recap\n\n`;
  const text = (header + content).slice(0, WHATSAPP_SHARE.maxTextChars);
  return WHATSAPP_SHARE.base + encodeURIComponent(text);
}
