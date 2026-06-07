/**
 * Navi voice (Web Speech API) constants.
 *
 * Voice is opt-in and off by default — the avatar leads with a text bubble first
 * (see product direction). Enabling it lets Navi speak her scripted lines aloud.
 * See `@/utils/navi-voice`.
 */

/** localStorage key for the attendee's voice on/off preference. */
export const VOICE_STORAGE_KEY = "ihhh:navi-voice";

/** Persisted preference values (no raw strings — compare against these). */
export const VOICE_PREF = {
  On: "on",
  Off: "off",
} as const;

/** SpeechSynthesis tuning + preferred voices (first available wins). */
export const VOICE_CONFIG = {
  /** Speaking rate (1 = normal). Slightly brisk + upbeat for an event host. */
  rate: 1.04,
  /** Pitch (1 = normal). A touch higher for a friendly mascot. */
  pitch: 1.12,
  /** Volume, 0–1. */
  volume: 1,
  /** Preferred BCP-47 language. */
  lang: "en-US",
  /** Locale prefix used as a last-resort voice fallback. */
  langPrefix: "en",
  /** Preferred system voice names, in priority order. */
  preferredVoices: [
    "Google US English",
    "Samantha",
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Karen",
    "Moira",
  ],
} as const;
