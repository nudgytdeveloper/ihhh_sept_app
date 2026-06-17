"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  VOICE_CONFIG,
  VOICE_PREF,
  VOICE_STORAGE_KEY,
  VOICE_PROVIDER,
  VoiceProvider,
  VOICE_API_PATH,
  CLOUD_VOICE_CONFIG,
} from "@/constants/voice";

/* ----------------------------- low-level speech ---------------------------- */

/** Whether the browser supports the Web Speech API (SpeechSynthesis). */
export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Pick the best available voice for Navi, falling back to any English voice. */
function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  for (const name of VOICE_CONFIG.preferredVoices) {
    const match = voices.find((voice) => voice.name === name);
    if (match) return match;
  }
  return (
    voices.find((voice) => voice.lang === VOICE_CONFIG.lang) ??
    voices.find((voice) => voice.lang.startsWith(VOICE_CONFIG.langPrefix)) ??
    voices[0]
  );
}

/** A cloud-voice (ElevenLabs) clip currently playing, if any. */
let currentAudio: HTMLAudioElement | null = null;
/** Cache of already-fetched cloud clips: text → object URL (Navi's lines repeat). */
const audioCache = new Map<string, string>();

/** Stop the cloud-voice clip, if one is playing. */
function stopAudio(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
}

/** Stop any in-progress speech (Web Speech utterance or cloud clip) immediately. */
export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
  stopAudio();
}

/** Whether Navi can speak at all with the active provider. */
export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  // The cloud provider plays MP3 via <audio>, which every browser supports.
  if (VOICE_PROVIDER === VoiceProvider.ElevenLabs) return true;
  return isSpeechSupported();
}

let lastSpoken = "";

/** Speak a line with the free, device-native Web Speech API. */
function speakViaWebSpeech(text: string): void {
  if (!isSpeechSupported()) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utterance.voice = voice;
  utterance.lang = VOICE_CONFIG.lang;
  utterance.rate = VOICE_CONFIG.rate;
  utterance.pitch = VOICE_CONFIG.pitch;
  utterance.volume = VOICE_CONFIG.volume;
  synth.speak(utterance);
}

/** Small awaitable delay (used for retry backoff). */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Whether the current text is still the line Navi is meant to be speaking. */
function isCurrentLine(text: string): boolean {
  return voiceEnabled && text === lastSpoken;
}

/**
 * Fetch a Navi line's MP3 from the voice route, retrying transient failures —
 * a cold-start 502 on a free host, a rate-limit, or a network blip — with a
 * short backoff before giving up. This is what keeps the *first* enable on the
 * natural voice: on Render the very first /api/voice hit can 502 while the server
 * warms, and without a retry the client would fall back to the robotic voice
 * until the attendee toggled off and on again. Permanent failures (501 not
 * configured / 4xx) and a line nobody is waiting on anymore bail immediately.
 */
async function fetchCloudClip(text: string): Promise<string> {
  const { clientRetries, clientRetryDelayMs } = CLOUD_VOICE_CONFIG;
  for (let attempt = 0; ; attempt++) {
    if (attempt > 0) {
      await delay(clientRetryDelayMs * attempt);
      // Stop retrying once voice is off or Navi has moved to a new line.
      if (!isCurrentLine(text)) throw new Error("voice stale");
    }
    let status = 0; // 0 = fetch threw (network error) — treat as transient.
    try {
      const res = await fetch(VOICE_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) return URL.createObjectURL(await res.blob());
      status = res.status;
    } catch {
      status = 0;
    }
    const transient = status === 0 || status === 429 || status >= 500;
    if (!transient || attempt >= clientRetries) {
      throw new Error(`voice route ${status}`);
    }
  }
}

/**
 * Speak a line with the ElevenLabs cloud voice (natural/human). Fetches the MP3
 * from our server route (which holds the secret key), caches it by text, and
 * plays it. Falls back to the Web Speech voice only after exhausting retries —
 * no key, repeated network/upstream errors, or an autoplay block — so Navi always
 * has a voice.
 */
async function speakViaCloud(text: string): Promise<void> {
  try {
    let url = audioCache.get(text);
    if (!url) {
      url = await fetchCloudClip(text);
      audioCache.set(text, url);
    }
    // The attendee may have toggled voice off or moved to a new line while the
    // clip was fetching — don't play a stale one.
    if (!isCurrentLine(text)) return;
    stopAudio();
    const audio = new Audio(url);
    currentAudio = audio;
    await audio.play();
  } catch {
    // Out of retries (or autoplay blocked) → fall back to the always-available
    // browser voice so Navi still speaks.
    if (isCurrentLine(text)) speakViaWebSpeech(text);
  }
}

/**
 * Speak a line as Navi — but only when voice is enabled. De-duplicates the most
 * recent line so repeated renders of the same text don't stack utterances, and
 * never queues (the host speaks one current line at a time). Routes to the
 * configured provider: the cloud ElevenLabs voice, else the browser voice.
 */
export function speakLine(text: string): void {
  if (!voiceEnabled || !text) return;
  if (text === lastSpoken) return;
  lastSpoken = text;
  if (VOICE_PROVIDER === VoiceProvider.ElevenLabs) {
    void speakViaCloud(text);
  } else {
    speakViaWebSpeech(text);
  }
}

/* ------------------------------- enabled store ----------------------------- */

let voiceEnabled = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function subscribeEnabled(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getEnabledSnapshot(): boolean {
  return voiceEnabled;
}

function getServerSnapshot(): boolean {
  return false;
}

const noopSubscribe = () => () => {};

/** Turn Navi's voice on/off (persisted). Turning off also stops any speech. */
export function setVoiceEnabled(next: boolean): void {
  if (voiceEnabled === next) return;
  voiceEnabled = next;
  lastSpoken = "";
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(VOICE_STORAGE_KEY, next ? VOICE_PREF.On : VOICE_PREF.Off);
    } catch {
      /* ignore storage failures (private mode, quota, etc.) */
    }
  }
  if (!next) cancelSpeech();
  emit();
}

/** Restore the saved voice preference (safe to call on every client mount). */
export function initVoiceFromStorage(): void {
  if (typeof window === "undefined" || voiceEnabled) return;
  try {
    if (window.localStorage.getItem(VOICE_STORAGE_KEY) === VOICE_PREF.On) {
      voiceEnabled = true;
      emit();
    }
  } catch {
    /* ignore */
  }
}

/* --------------------------------- the hook -------------------------------- */

export interface NaviVoice {
  /** Whether voice is currently on. */
  enabled: boolean;
  /** Whether the browser can speak at all. */
  supported: boolean;
  /** Flip voice on/off. */
  toggle: () => void;
  /** Speak a line (no-op when disabled). */
  speak: (text: string) => void;
}

/**
 * React binding for Navi's voice. Backed by a module-level store, so the toggle
 * (header) and the speaking screens (hero, game) all share one source of truth
 * and stay in sync across route changes.
 */
export function useNaviVoice(): NaviVoice {
  const enabled = useSyncExternalStore(subscribeEnabled, getEnabledSnapshot, getServerSnapshot);
  // Support is false during SSR/hydration, then resolves on the client — no
  // mismatch, since useSyncExternalStore re-reads after hydration.
  const supported = useSyncExternalStore(noopSubscribe, isVoiceSupported, getServerSnapshot);

  useEffect(() => {
    initVoiceFromStorage();
  }, []);

  const toggle = useCallback(() => setVoiceEnabled(!getEnabledSnapshot()), []);

  return { enabled, supported, toggle, speak: speakLine };
}
