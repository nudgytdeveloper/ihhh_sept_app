"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  ChevronRight,
  Database,
  FileText,
  Loader2,
  Mic,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SessionRecorder } from "@/components/host/session-recorder";
import {
  SESSIONS_API_PATH,
  SESSION_LIMITS,
  SESSION_STATUS_META,
} from "@/constants/sessions";
import { countWords, isValidSessionInput } from "@/utils/sessions";
import { formatClockTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Session, SessionListResponse } from "@/types";

/**
 * Host speaker-sessions screen (Phase 3): create a session per speaker, record
 * it (live STT), and review/edit its transcript. Master list ⇄ single-session
 * recorder. The transcript later feeds the per-attendee AI summaries.
 */
export function SessionsScreen() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [available, setAvailable] = useState(true);
  const [failed, setFailed] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [speaker, setSpeaker] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch(SESSIONS_API_PATH, { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as SessionListResponse;
      setSessions(data.sessions);
      setAvailable(data.available);
      setFailed(false);
    } catch {
      setFailed(true);
      setSessions([]);
    }
  }, []);

  useEffect(() => {
    // First fetch from a timer callback (never setState in an effect body).
    const initial = setTimeout(() => void load(), 0);
    return () => clearTimeout(initial);
  }, [load]);

  const handleCreate = useCallback(async () => {
    if (!isValidSessionInput(title, speaker)) return;
    setCreating(true);
    try {
      const response = await fetch(SESSIONS_API_PATH, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, speaker }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { session } = (await response.json()) as { session: Session };
      setSessions((prev) => [session, ...(prev ?? [])]);
      setTitle("");
      setSpeaker("");
      setActiveId(session.id);
    } catch {
      toast.error("Couldn't create the session.");
    } finally {
      setCreating(false);
    }
  }, [title, speaker]);

  const handleUpdated = useCallback((updated: Session) => {
    setSessions((prev) =>
      (prev ?? []).map((item) => (item.id === updated.id ? updated : item)),
    );
  }, []);

  const handleDeleted = useCallback((id: string) => {
    setSessions((prev) => (prev ?? []).filter((item) => item.id !== id));
    setActiveId(null);
  }, []);

  const active = activeId ? sessions?.find((item) => item.id === activeId) ?? null : null;
  const loading = sessions === null && !failed;

  if (active) {
    return (
      <div className="px-5 py-6">
        <SessionRecorder
          session={active}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
          onBack={() => setActiveId(null)}
        />
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-col gap-4 px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Speaker sessions</h1>
          <p className="text-sm text-muted-foreground">
            Record each talk — the live transcript feeds the AI session summaries.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void load()}
          disabled={loading || !available}
        >
          <RefreshCw className="size-4" />
          Refresh
        </Button>
      </div>

      {available ? (
        <Card>
          <CardContent className="flex flex-col gap-3 py-5 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Session title</label>
              <input
                value={title}
                maxLength={SESSION_LIMITS.titleMax}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Keynote: Building Resilient Teams"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <div className="flex-1 space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Speaker</label>
              <input
                value={speaker}
                maxLength={SESSION_LIMITS.speakerMax}
                onChange={(event) => setSpeaker(event.target.value)}
                placeholder="e.g. Dr. Amara Osei"
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={creating || !isValidSessionInput(title, speaker)}
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Add session
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {loading ? <SessionsSkeleton /> : null}

      {!available ? (
        <EmptyState
          icon={Database}
          title="No database configured"
          detail="Set DATABASE_URL to record and store speaker transcripts."
        />
      ) : null}

      {failed && available ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load sessions"
          detail="The event server didn't respond — try a refresh."
        />
      ) : null}

      {available && sessions && sessions.length === 0 && !failed ? (
        <EmptyState
          icon={Mic}
          title="No sessions yet"
          detail="Add a session above, then hit record when the speaker takes the stage."
        />
      ) : null}

      {sessions && sessions.length > 0 ? (
        <div className="flex flex-col gap-2.5">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} onOpen={() => setActiveId(session.id)} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SessionRow({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const meta = SESSION_STATUS_META[session.status];
  const words = countWords(session.transcript);
  return (
    <button
      onClick={onOpen}
      className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:border-brand-blue/40"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
        <FileText className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{session.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {session.speaker}
          {words > 0 ? ` · ${words} words` : ""} · {formatClockTime(session.createdAt)}
        </p>
      </div>
      <Badge variant="outline" className="gap-1.5">
        <span className={cn("size-1.5 rounded-full", meta.dot)} />
        {meta.label}
      </Badge>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Mic;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border bg-card py-12 text-center">
      <Icon className="size-7 text-muted-foreground/50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-[20rem] text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function SessionsSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-2.5 w-1/3" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      ))}
    </div>
  );
}
