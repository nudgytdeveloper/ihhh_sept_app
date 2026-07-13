/**
 * Personalized AI session summaries (Nov-event Phase 4).
 *
 * For each recorded talk, an attendee can generate a short recap tailored to
 * their learning goals (Claude), edit it, and share it to WhatsApp. Summaries
 * are cached per (session × attendee) and editable.
 */

export const SUMMARIES_API_PATH = "/api/summaries";

/** Attendee-facing "Session recaps" screen. */
export const RECAPS_ROUTE = "/recaps";

/**
 * Claude (Anthropic Messages API) settings. The secret ANTHROPIC_API_KEY is
 * read ONLY server-side by the /api/summaries route — never bundled to the
 * client (same rule as the ElevenLabs key).
 */
export const SUMMARY_CONFIG = {
  endpoint: "https://api.anthropic.com/v1/messages",
  anthropicVersion: "2023-06-01",
  /**
   * Default model. Sonnet 5 is the latest-generation, cost-effective choice for
   * summarization at per-attendee scale; override with ANTHROPIC_MODEL to use a
   * more capable model (e.g. claude-opus-4-8) when quality outweighs cost.
   */
  model: "claude-sonnet-5",
  maxTokens: 700,
  /** Cap the transcript sent to Claude (control cost/latency) — chars. */
  maxTranscriptChars: 24_000,
  /** Extra server attempts when the Anthropic upstream blips (5xx / 429 / network). */
  retries: 2,
  retryDelayMs: 600,
} as const;

/** Limits for a stored/edited summary. */
export const SUMMARY_LIMITS = {
  /** Hard cap on summary content length (chars). */
  contentMax: 8_000,
} as const;

/**
 * WhatsApp "click to chat" share. `wa.me/?text=` opens WhatsApp with the recap
 * pre-filled so the attendee picks who to send it to — no WhatsApp API, no
 * recipient number (per the Nov-event decision).
 */
export const WHATSAPP_SHARE = {
  base: "https://wa.me/?text=",
  /** Keep the shared text well under URL limits (WhatsApp/browser). */
  maxTextChars: 1_600,
} as const;
