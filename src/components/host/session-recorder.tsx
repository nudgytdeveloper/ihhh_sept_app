"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowLeft,
  AudioLines,
  Cloud,
  Loader2,
  Mic,
  Save,
  Square,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RECORDING_CONFIG,
  RecorderState,
  SESSIONS_API_PATH,
  SESSION_STATUS_META,
  SessionStatus,
  STT_PROVIDER,
  SttProvider,
  TRANSCRIBE_API_PATH,
} from "@/constants/sessions";
import { useSessionRecorder } from "@/utils/use-session-recorder";
import { appendSegment, countWords } from "@/utils/sessions";
import { formatCountdown } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Session } from "@/types";

const PROVIDER_LABEL =
  STT_PROVIDER === SttProvider.Scribe ? "ElevenLabs Scribe" : "Web Speech (live)";

/**
 * Record + transcribe one speaker session. The mic feeds a live-growing
 * transcript (via useSessionRecorder); the transcript is persisted to the
 * session as it grows and on stop, and is editable once recording finishes.
 */
export function SessionRecorder({
  session,
  onUpdated,
  onDeleted,
  onBack,
}: {
  session: Session;
  onUpdated: (session: Session) => void;
  onDeleted: (id: string) => void;
  onBack: () => void;
}) {
  const [transcript, setTranscript] = useState(session.transcript);
  const [edited, setEdited] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [scribeReady, setScribeReady] = useState(true);

  const transcriptRef = useRef(transcript);
  useEffect(() => {
    transcriptRef.current = transcript;
  });
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const patchSession = useCallback(
    async (patch: Partial<Pick<Session, "transcript" | "status">>): Promise<void> => {
      try {
        const response = await fetch(`${SESSIONS_API_PATH}/${session.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!response.ok) throw new Error(String(response.status));
        const { session: updated } = (await response.json()) as { session: Session };
        onUpdated(updated);
      } catch {
        toast.error("Couldn't save the transcript — check the connection.");
      }
    },
    [session.id, onUpdated],
  );

  // Leading-edge throttle: first new segment schedules a flush; later segments
  // within the window ride along (the flush reads the latest transcript).
  const schedulePersist = useCallback(() => {
    if (persistTimerRef.current) return;
    persistTimerRef.current = setTimeout(() => {
      persistTimerRef.current = null;
      void patchSession({ transcript: transcriptRef.current });
    }, RECORDING_CONFIG.persistThrottleMs);
  }, [patchSession]);

  const recorder = useSessionRecorder({
    onSegment: (text) => {
      setTranscript((prev) => appendSegment(prev, text));
      schedulePersist();
    },
  });

  const isLive = recorder.state === RecorderState.Live;
  const isStarting = recorder.state === RecorderState.Starting;

  // Warn up front if the cloud provider is selected but has no key configured.
  useEffect(() => {
    if (STT_PROVIDER !== SttProvider.Scribe) return;
    let active = true;
    fetch(TRANSCRIBE_API_PATH)
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        if (active) setScribeReady(Boolean(data.configured));
      })
      .catch(() => {
        /* leave optimistic — the recorder surfaces a 501 if truly unset */
      });
    return () => {
      active = false;
    };
  }, []);

  const handleStart = useCallback(() => {
    setConfirmDelete(false);
    recorder.start();
    void patchSession({ status: SessionStatus.Recording });
  }, [recorder, patchSession]);

  const handleStop = useCallback(() => {
    recorder.stop();
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    void patchSession({ transcript: transcriptRef.current, status: SessionStatus.Ready });
  }, [recorder, patchSession]);

  const handleSaveEdit = useCallback(async () => {
    setSaving(true);
    await patchSession({ transcript });
    setSaving(false);
    setEdited(false);
    toast.success("Transcript saved.");
  }, [patchSession, transcript]);

  const handleDelete = useCallback(async () => {
    try {
      const response = await fetch(`${SESSIONS_API_PATH}/${session.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(String(response.status));
      onDeleted(session.id);
      toast.success("Session deleted.");
    } catch {
      toast.error("Couldn't delete the session.");
    }
  }, [session.id, onDeleted]);

  const meta = SESSION_STATUS_META[session.status];
  const words = countWords(transcript);

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          All sessions
        </button>
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Delete this session?</span>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-rose-500/40 text-rose-600 hover:bg-rose-500/10"
              onClick={handleDelete}
            >
              Confirm delete
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-rose-600"
            onClick={() => setConfirmDelete(true)}
            disabled={isLive || isStarting}
          >
            <Trash2 className="size-4" />
            Delete
          </Button>
        )}
      </div>

      {/* Session header */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{session.title}</h1>
            <p className="text-sm text-muted-foreground">{session.speaker}</p>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <span className={cn("size-1.5 rounded-full", isLive ? "animate-pulse bg-rose-500" : meta.dot)} />
            {isLive ? "Recording" : meta.label}
          </Badge>
        </div>

        {/* Record controls */}
        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-border pt-4">
          {isLive ? (
            <Button onClick={handleStop} className="bg-rose-600 text-white hover:bg-rose-700">
              <Square className="size-4 fill-current" />
              Stop recording
            </Button>
          ) : (
            <Button onClick={handleStart} disabled={isStarting} className="bg-brand-gradient text-white">
              {isStarting ? <Loader2 className="size-4 animate-spin" /> : <Mic className="size-4" />}
              {isStarting ? "Starting…" : session.transcript ? "Resume recording" : "Start recording"}
            </Button>
          )}

          {isLive ? (
            <span className="flex items-center gap-2 font-mono text-sm tabular-nums text-muted-foreground">
              <span className="size-2 animate-pulse rounded-full bg-rose-500" />
              {formatCountdown(Math.floor(recorder.elapsedMs / 1000))}
              {recorder.pending > 0 ? (
                <span className="text-xs">· transcribing {recorder.pending}…</span>
              ) : null}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {STT_PROVIDER === SttProvider.Scribe ? (
                <Cloud className="size-3.5" />
              ) : (
                <AudioLines className="size-3.5" />
              )}
              {PROVIDER_LABEL}
            </span>
          )}
        </div>

        {recorder.errorMessage ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-600">
            <TriangleAlert className="size-3.5 shrink-0" />
            {recorder.errorMessage}
          </p>
        ) : null}
        {STT_PROVIDER === SttProvider.Scribe && !scribeReady ? (
          <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700">
            <TriangleAlert className="size-3.5 shrink-0" />
            Cloud transcription isn&apos;t configured — set ELEVENLABS_API_KEY, or use the free Web Speech provider.
          </p>
        ) : null}
      </div>

      {/* Transcript */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">Transcript</h2>
            <p className="text-xs text-muted-foreground">
              {words} {words === 1 ? "word" : "words"}
              {isLive ? " · listening…" : edited ? " · unsaved edits" : ""}
            </p>
          </div>
          {!isLive && edited ? (
            <Button size="sm" onClick={handleSaveEdit} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
          ) : null}
        </div>

        {isLive ? (
          <div className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-lg bg-secondary/50 p-4 text-sm leading-relaxed">
            {transcript || (
              <span className="text-muted-foreground">Listening — the transcript will appear here…</span>
            )}
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-blink bg-rose-500 align-middle" />
          </div>
        ) : (
          <textarea
            value={transcript}
            onChange={(event) => {
              setTranscript(event.target.value);
              setEdited(true);
            }}
            placeholder="No transcript yet — press Start recording when the speaker begins."
            className="h-64 w-full resize-y rounded-lg border border-input bg-background p-4 text-sm leading-relaxed outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
        )}
        {!isLive ? (
          <p className="mt-2 text-xs text-muted-foreground">
            Fix any slips here — a clean transcript makes for better AI summaries.
          </p>
        ) : null}
      </div>
    </div>
  );
}
