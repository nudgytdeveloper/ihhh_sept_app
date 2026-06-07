"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { VOICE_CONFIG, VOICE_PREF, VOICE_STORAGE_KEY } from "@/constants/voice";

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

/** Stop any in-progress speech immediately. */
export function cancelSpeech(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

let lastSpoken = "";

/**
 * Speak a line as Navi — but only when voice is enabled. De-duplicates the most
 * recent line so repeated renders of the same text don't stack utterances, and
 * never queues (the host speaks one current line at a time).
 */
export function speakLine(text: string): void {
  if (!voiceEnabled || !text || !isSpeechSupported()) return;
  if (text === lastSpoken) return;
  lastSpoken = text;

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
  const supported = useSyncExternalStore(noopSubscribe, isSpeechSupported, getServerSnapshot);

  useEffect(() => {
    initVoiceFromStorage();
  }, []);

  const toggle = useCallback(() => setVoiceEnabled(!getEnabledSnapshot()), []);

  return { enabled, supported, toggle, speak: speakLine };
}
