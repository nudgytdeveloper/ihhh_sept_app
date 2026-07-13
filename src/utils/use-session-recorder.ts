"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  RECORDING_CONFIG,
  RecorderState,
  SCRIBE_CONFIG,
  STT_PROVIDER,
  SttProvider,
  TRANSCRIBE_API_PATH,
} from "@/constants/sessions";
import { pickRecordingMime } from "@/utils/sessions";
import type { TranscribeResponse } from "@/types";

/**
 * Host session recorder (Phase 3). Captures the speaker's mic and produces a
 * live-growing transcript, one finalized chunk at a time via `onSegment`.
 *
 * Two engines behind one interface (chosen by STT_PROVIDER, mirroring the voice
 * provider):
 *  - Web Speech (default, free): the browser's SpeechRecognition streams final
 *    results directly — no upload, no key.
 *  - Scribe: MediaRecorder captures short, independently-decodable segments
 *    (stop/restart each interval) that are POSTed to `/api/transcribe`
 *    (ElevenLabs Scribe) and appended as they return.
 */

export interface SessionRecorder {
  state: RecorderState;
  /** Seconds elapsed since recording started (0 when idle). */
  elapsedMs: number;
  /** Segments awaiting transcription (Scribe only). */
  pending: number;
  /** Human-readable problem, when state is Error/Unsupported. */
  errorMessage: string | null;
  start: () => void;
  stop: () => void;
}

interface UseSessionRecorderOptions {
  /** Called with each finalized transcript chunk (append it to the transcript). */
  onSegment: (text: string) => void;
}

/** Filename extension for a recorded blob, from its mime type. */
function mimeToExt(mime: string): string {
  if (mime.includes("webm")) return "webm";
  if (mime.includes("mp4")) return "m4a";
  if (mime.includes("ogg")) return "ogg";
  return "audio";
}

export function useSessionRecorder({ onSegment }: UseSessionRecorderOptions): SessionRecorder {
  const [state, setState] = useState<RecorderState>(RecorderState.Idle);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [pending, setPending] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Latest onSegment without re-subscribing the recorder machinery.
  const onSegmentRef = useRef(onSegment);
  useEffect(() => {
    onSegmentRef.current = onSegment;
  });

  // Shared recorder machinery (refs are the live source of truth, not state).
  const runningRef = useRef(false);
  const startedAtRef = useRef(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Web Speech
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  // Scribe / MediaRecorder
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const mimeRef = useRef<string>("");
  const segTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest beginSegment, so the recursive segment rotation avoids a TDZ self-ref.
  const beginSegmentRef = useRef<() => void>(() => {});

  const emitSegment = useCallback((text: string) => {
    const clean = text.trim();
    if (clean) onSegmentRef.current(clean);
  }, []);

  const startClock = useCallback(() => {
    startedAtRef.current = performance.now();
    setElapsedMs(0);
    tickRef.current = setInterval(() => {
      setElapsedMs(performance.now() - startedAtRef.current);
    }, 250);
  }, []);

  const stopClock = useCallback(() => {
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  /* ------------------------------- Web Speech ------------------------------ */

  const startWebSpeech = useCallback(() => {
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setErrorMessage("This browser can't record — try Chrome, or switch to cloud transcription.");
      setState(RecorderState.Unsupported);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = SCRIBE_CONFIG.lang;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) emitSegment(result[0].transcript);
      }
    };
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        runningRef.current = false;
        setErrorMessage("Microphone permission was denied.");
        setState(RecorderState.Error);
      } else if (event.error === "audio-capture") {
        runningRef.current = false;
        setErrorMessage("No microphone was found.");
        setState(RecorderState.Error);
      }
      // 'no-speech' / 'aborted' / transient 'network' are benign — onend restarts.
    };
    recognition.onend = () => {
      // Recognition self-stops after a pause; restart while still recording.
      if (runningRef.current) {
        try {
          recognition.start();
        } catch {
          /* already starting */
        }
      } else {
        setState(RecorderState.Idle);
      }
    };

    recognitionRef.current = recognition;
    runningRef.current = true;
    try {
      recognition.start();
      setState(RecorderState.Live);
      startClock();
    } catch {
      runningRef.current = false;
      setErrorMessage("Couldn't start the recognizer.");
      setState(RecorderState.Error);
    }
  }, [emitSegment, startClock]);

  const stopWebSpeech = useCallback(() => {
    runningRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }, []);

  /* --------------------------------- Scribe -------------------------------- */

  const uploadSegment = useCallback(async (blob: Blob) => {
    if (blob.size < RECORDING_CONFIG.minSegmentBytes) return;
    setPending((count) => count + 1);
    try {
      const form = new FormData();
      form.append("file", blob, `segment.${mimeToExt(blob.type || mimeRef.current)}`);
      const response = await fetch(TRANSCRIBE_API_PATH, { method: "POST", body: form });
      if (response.status === 501) {
        setErrorMessage("Cloud transcription isn't configured (ELEVENLABS_API_KEY).");
        return;
      }
      if (!response.ok) return;
      const { text } = (await response.json()) as TranscribeResponse;
      emitSegment(text);
    } catch {
      /* a dropped segment shouldn't abort the whole talk */
    } finally {
      setPending((count) => count - 1);
    }
  }, [emitSegment]);

  const cleanupScribe = useCallback(() => {
    if (segTimerRef.current) clearTimeout(segTimerRef.current);
    segTimerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setState(RecorderState.Idle);
  }, []);

  const beginSegment = useCallback(() => {
    const stream = streamRef.current;
    if (!stream) return;
    const recorder = new MediaRecorder(stream, { mimeType: mimeRef.current });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeRef.current });
      void uploadSegment(blob);
      if (runningRef.current) beginSegmentRef.current();
      else cleanupScribe();
    };
    recorderRef.current = recorder;
    recorder.start();
    // Rotate segments: stopping finalizes a standalone file, then onstop restarts.
    segTimerRef.current = setTimeout(() => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
    }, RECORDING_CONFIG.segmentMs);
  }, [uploadSegment, cleanupScribe]);

  // Keep the recursion ref pointed at the latest beginSegment.
  useEffect(() => {
    beginSegmentRef.current = beginSegment;
  }, [beginSegment]);

  const startScribe = useCallback(async () => {
    const mime = pickRecordingMime();
    if (!mime || !navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("This browser can't record audio.");
      setState(RecorderState.Unsupported);
      return;
    }
    setState(RecorderState.Starting);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      mimeRef.current = mime;
      runningRef.current = true;
      setState(RecorderState.Live);
      startClock();
      beginSegment();
    } catch {
      setErrorMessage("Microphone permission was denied.");
      setState(RecorderState.Error);
    }
  }, [beginSegment, startClock]);

  const stopScribe = useCallback(() => {
    runningRef.current = false;
    if (segTimerRef.current) clearTimeout(segTimerRef.current);
    segTimerRef.current = null;
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.stop(); // → onstop flushes the final segment, then cleanupScribe
    } else {
      cleanupScribe();
    }
  }, [cleanupScribe]);

  /* --------------------------------- API ----------------------------------- */

  const start = useCallback(() => {
    if (runningRef.current) return;
    setErrorMessage(null);
    setPending(0);
    if (STT_PROVIDER === SttProvider.Scribe) void startScribe();
    else startWebSpeech();
  }, [startScribe, startWebSpeech]);

  const stop = useCallback(() => {
    if (!runningRef.current) return;
    stopClock();
    if (STT_PROVIDER === SttProvider.Scribe) stopScribe();
    else stopWebSpeech();
  }, [stopClock, stopScribe, stopWebSpeech]);

  // Stop the mic + timers if the component unmounts mid-recording.
  useEffect(() => {
    return () => {
      runningRef.current = false;
      stopClock();
      if (segTimerRef.current) clearTimeout(segTimerRef.current);
      recognitionRef.current?.stop();
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [stopClock]);

  return { state, elapsedMs, pending, errorMessage, start, stop };
}
