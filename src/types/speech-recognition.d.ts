/**
 * Minimal ambient types for the Web Speech API's SpeechRecognition, which isn't
 * in TypeScript's DOM lib yet (it's still vendor-prefixed). Builds on the
 * `SpeechRecognitionResultList` / `SpeechRecognitionResult` types the DOM lib
 * does provide. Used by `@/utils/use-session-recorder` (Phase 3 STT). Global
 * script file — no imports/exports.
 */

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((event: Event) => void) | null;
  onstart: ((event: Event) => void) | null;
}

interface SpeechRecognitionCtor {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
}

interface Window {
  SpeechRecognition?: SpeechRecognitionCtor;
  webkitSpeechRecognition?: SpeechRecognitionCtor;
}
