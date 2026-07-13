/**
 * Speaker sessions + speech-to-text (Nov-event Phase 3).
 *
 * One host device records each speaker; the audio is transcribed live by
 * ElevenLabs Scribe and the transcript is persisted per session. The transcript
 * later feeds the per-attendee AI summaries (Phase 4).
 */

/** Lifecycle of a recorded speaker session. */
export enum SessionStatus {
  /** Created, not yet recorded. */
  Scheduled = "scheduled",
  /** The host is recording + transcribing live right now. */
  Recording = "recording",
  /** Recording stopped — transcript captured, ready for summaries. */
  Ready = "ready",
}

export const SESSION_STATUS_ORDER: readonly SessionStatus[] = [
  SessionStatus.Scheduled,
  SessionStatus.Recording,
  SessionStatus.Ready,
] as const;

export interface SessionStatusMeta {
  /** Short status label for a pill. */
  label: string;
  /** One-line description of the state. */
  description: string;
  /** Dot/accent color class (Tailwind literal). */
  dot: string;
}

export const SESSION_STATUS_META: Record<SessionStatus, SessionStatusMeta> = {
  [SessionStatus.Scheduled]: {
    label: "Scheduled",
    description: "Ready to record when the speaker takes the stage.",
    dot: "bg-muted-foreground",
  },
  [SessionStatus.Recording]: {
    label: "Recording",
    description: "Capturing + transcribing the talk live.",
    dot: "bg-rose-500",
  },
  [SessionStatus.Ready]: {
    label: "Transcript ready",
    description: "Recording done — transcript captured for summaries.",
    dot: "bg-emerald-500",
  },
};

/** Input limits (mirrored server-side by the sessions route). */
export const SESSION_LIMITS = {
  titleMax: 90,
  speakerMax: 60,
  /** Hard cap so a runaway transcript can't bloat a row. */
  transcriptMax: 200_000,
} as const;

/** Live-recording tuning — keep the magic numbers here. */
export const RECORDING_CONFIG = {
  /**
   * Length of each recorded segment, in ms. The recorder stops + restarts on
   * this cadence so every segment is a complete, independently-decodable audio
   * file Scribe can transcribe on its own; the transcript grows one segment at
   * a time. Shorter = more "live" but more requests + more restart gaps.
   */
  segmentMs: 15_000,
  /**
   * MediaRecorder mime types to try, best first. Chrome/Firefox land on webm/opus;
   * Safari on mp4. The first `isTypeSupported` wins.
   */
  mimeCandidates: [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/ogg;codecs=opus",
  ] as const,
  /** Skip segments smaller than this (near-silence / a stray restart) — bytes. */
  minSegmentBytes: 2_000,
  /** Persist the growing transcript to the DB at most this often, in ms. */
  persistThrottleMs: 4_000,
} as const;

/**
 * ElevenLabs Scribe (speech-to-text). Reuses the SAME server-only
 * ELEVENLABS_API_KEY as Navi's voice — read only in the /api/transcribe route,
 * never bundled into the client.
 */
export const SCRIBE_CONFIG = {
  endpoint: "https://api.elevenlabs.io/v1/speech-to-text",
  /** Scribe model — accurate multilingual STT. */
  modelId: "scribe_v1",
  /** Don't tag `(laughter)`/`(applause)` — keeps the transcript clean for summaries. */
  tagAudioEvents: false,
  /** Single speaker on stage per session — no diarization needed. */
  diarize: false,
  /** BCP-47 language hint used by the Web Speech provider. */
  lang: "en-US",
} as const;

/** Live state of the host recorder (drives the record button + status text). */
export enum RecorderState {
  /** Not recording. */
  Idle = "idle",
  /** Requesting the mic / warming up the recognizer. */
  Starting = "starting",
  /** Recording + transcribing live. */
  Live = "live",
  /** A fatal problem (mic denied, no device, cloud not configured). */
  Error = "error",
  /** This browser can't record with the selected provider. */
  Unsupported = "unsupported",
}

/** Transcription engine behind the host recorder (mirrors the voice provider). */
export enum SttProvider {
  /** Browser-native Web Speech API — free, live, Chrome/Safari (DEFAULT). */
  WebSpeech = "webspeech",
  /** ElevenLabs Scribe — natural-quality cloud STT (needs the server API key). */
  Scribe = "scribe",
}

/**
 * Active STT provider, chosen at build time via NEXT_PUBLIC_STT_PROVIDER.
 * Defaults to the free Web Speech API (zero-config — works locally + for a
 * no-key demo); set it to "scribe" (and configure the server-side
 * ELEVENLABS_API_KEY) for natural-quality cloud transcription.
 */
export const STT_PROVIDER: SttProvider =
  process.env.NEXT_PUBLIC_STT_PROVIDER === SttProvider.Scribe
    ? SttProvider.Scribe
    : SttProvider.WebSpeech;

export const SESSIONS_API_PATH = "/api/sessions";
export const TRANSCRIBE_API_PATH = "/api/transcribe";
