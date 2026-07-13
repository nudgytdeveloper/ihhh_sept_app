"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { SummaryCard } from "@/components/navigator/summary-card";
import { Reveal } from "@/components/navigator/reveal";
import { usePlayerIdentity } from "@/utils/player-identity";
import { indexSummariesBySession, isSummarizable } from "@/utils/summaries";
import { SESSIONS_API_PATH } from "@/constants/sessions";
import { SUMMARIES_API_PATH } from "@/constants/summaries";
import { AVATAR_NAME } from "@/constants/app";
import type {
  Session,
  SessionListResponse,
  Summary,
  SummaryListResponse,
} from "@/types";

/**
 * Attendee "Session recaps" (Phase 4): for each recorded talk, generate a
 * personal AI recap keyed to your learning goals, edit it, and share it to
 * WhatsApp. Reads the onboarded identity (id + goals) for personalization.
 */
export function RecapsScreen() {
  const identity = usePlayerIdentity();
  const attendeeId = identity.id;

  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [available, setAvailable] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    if (!attendeeId) return;
    try {
      const [sesRes, sumRes] = await Promise.all([
        fetch(SESSIONS_API_PATH, { cache: "no-store" }),
        fetch(`${SUMMARIES_API_PATH}?attendeeId=${encodeURIComponent(attendeeId)}`, {
          cache: "no-store",
        }),
      ]);
      const sesData = (await sesRes.json()) as SessionListResponse;
      const sumData = (await sumRes.json()) as SummaryListResponse;
      setSessions(sesData.sessions);
      setAvailable(sesData.available);
      setSummaries(sumData.summaries ?? []);
      setFailed(false);
    } catch {
      setFailed(true);
      setSessions([]);
    }
  }, [attendeeId]);

  useEffect(() => {
    if (!attendeeId) return;
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [attendeeId, load]);

  const summaryBySession = useMemo(() => indexSummariesBySession(summaries), [summaries]);
  const recappable = (sessions ?? []).filter(isSummarizable);

  const handleSummary = useCallback((updated: Summary) => {
    setSummaries((prev) => [updated, ...prev.filter((item) => item.sessionId !== updated.sessionId)]);
  }, []);

  const goalChips = [...identity.goals.selected, identity.goals.custom.trim()].filter(Boolean);
  const hydrating = attendeeId === "" || (sessions === null && !failed);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-6">
      <Reveal delay={0}>
        <div className="bg-brand-gradient overflow-hidden rounded-2xl p-5 text-white shadow-soft-lg">
          <div className="flex items-center gap-2 text-sm font-medium opacity-90">
            <Wand2 className="size-4" />
            {AVATAR_NAME}&apos;s recaps
          </div>
          <h1 className="mt-1 text-xl font-bold text-white">Your session recaps</h1>
          <p className="mt-1 text-sm text-white/85">
            A personal summary of each talk, written around what you came to learn.
          </p>
          {goalChips.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {goalChips.map((goal) => (
                <span
                  key={goal}
                  className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white"
                >
                  {goal}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Reveal>

      {hydrating ? (
        <RecapsSkeleton />
      ) : !available ? (
        <EmptyState
          icon={Database}
          title="Recaps aren't available yet"
          detail="Session summaries need the event database — check back soon."
        />
      ) : failed ? (
        <EmptyState
          icon={RefreshCw}
          title="Couldn't load recaps"
          detail="The event server didn't respond — pull to refresh in a moment."
        />
      ) : recappable.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No recaps yet"
          detail={`Once a talk has been recorded, ${AVATAR_NAME} can write your personal recap here.`}
        />
      ) : (
        recappable.map((session, i) => (
          <Reveal key={session.id} delay={60 + i * 60}>
            <SummaryCard
              session={session}
              summary={summaryBySession.get(session.id) ?? null}
              attendeeId={attendeeId}
              goals={identity.goals}
              onSummary={handleSummary}
            />
          </Reveal>
        ))
      )}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Sparkles;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-12 text-center shadow-soft">
      <Icon className="size-7 text-muted-foreground/50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-[18rem] text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function RecapsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 2 }, (_, i) => (
        <div key={i} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-2 h-3 w-1/3" />
          <Skeleton className="mt-4 h-24 w-full" />
        </div>
      ))}
    </div>
  );
}
