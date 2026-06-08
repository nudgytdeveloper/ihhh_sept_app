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

/** TTS engine behind Navi's voice. */
export enum VoiceProvider {
  /** Browser-native Web Speech API — free, robotic, device-dependent (default). */
  WebSpeech = "webspeech",
  /** ElevenLabs cloud TTS — natural/human voice (needs a server-side API key). */
  ElevenLabs = "elevenlabs",
}

/**
 * Active voice provider, chosen at build time via NEXT_PUBLIC_VOICE_PROVIDER.
 * Defaults to the free Web Speech API; set it to "elevenlabs" (and configure the
 * server-side ELEVENLABS_API_KEY) to give Navi a human voice.
 */
export const VOICE_PROVIDER: VoiceProvider =
  process.env.NEXT_PUBLIC_VOICE_PROVIDER === VoiceProvider.ElevenLabs
    ? VoiceProvider.ElevenLabs
    : VoiceProvider.WebSpeech;

/** Server route that proxies a Navi line to the cloud TTS provider (returns MP3). */
export const VOICE_API_PATH = "/api/voice";

/**
 * ElevenLabs tuning. The secret API key + (optional) voice id are read ONLY from
 * server env (ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID) by the /api/voice route —
 * never bundled into the client. defaultVoiceId is the shared "Rachel" voice that
 * every ElevenLabs account can use out of the box.
 */
export const ELEVENLABS_CONFIG = {
  /** Low-latency, natural model — a good balance for a live demo. */
  model: "eleven_turbo_v2_5",
  /** MP3 output the browser can play directly. */
  outputFormat: "mp3_44100_128",
  /** Fallback voice when ELEVENLABS_VOICE_ID is unset ("Rachel", warm female). */
  defaultVoiceId: "21m00Tcm4TlvDq8ikWAM",
  /** Expressive but stable settings for a friendly event host. */
  voiceSettings: {
    stability: 0.4,
    similarity_boost: 0.8,
    style: 0.35,
    use_speaker_boost: true,
  },
} as const;
