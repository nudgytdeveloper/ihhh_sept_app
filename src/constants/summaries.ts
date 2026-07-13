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
 * Google Gemini (Generative Language API) settings. The secret GEMINI_API_KEY
 * is read ONLY server-side by the /api/summaries route — never bundled to the
 * client (same rule as the ElevenLabs key). The model id is part of the URL
 * path, so `endpointBase` has the model + `:generateContent` appended per call.
 */
export const SUMMARY_CONFIG = {
  endpointBase: "https://generativelanguage.googleapis.com/v1beta/models",
  /**
   * Default model. Gemini 2.5 Flash is the fast, cost-effective choice for
   * summarization at per-attendee scale; override with GEMINI_MODEL to use a
   * more capable model (e.g. gemini-2.5-pro) when quality outweighs cost.
   */
  model: "gemini-2.5-flash",
  maxOutputTokens: 800,
  /** Cap the transcript sent to the model (control cost/latency) — chars. */
  maxTranscriptChars: 24_000,
  /** Extra server attempts when the Gemini upstream blips (5xx / 429 / network). */
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
