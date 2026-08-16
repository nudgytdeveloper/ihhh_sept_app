"use client";

import { useEffect, useState } from "react";
import { Route, ArrowRight, Check, Clock, Hand } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AVATAR_NAME } from "@/constants/app";
import {
  EventPhase,
  PHASE_ORDER,
  PHASE_META,
  PHASE_CONTROL_META,
  PHASE_CLOCK,
  PhaseControlMode,
  PhaseProgressState,
  type PhaseMeta,
} from "@/constants/phases";
import {
  getAvatarScript,
  getNextPhase,
  getNextScheduledPhase,
  getPhaseIndex,
  getPhaseState,
} from "@/utils/event";

/**
 * Host control for the event journey. The journey advances itself off the
 * programme clock (Auto); picking a phase here takes over (Manual) and that
 * override sticks until the host hands control back — so the clock can't move
 * the room mid-speech. Either way it drives Navi for every attendee live.
 */
/**
 * The phase the programme clock will move to next, re-read on the same cadence
 * the server ticks. Resolved after mount (never during render), because the
 * answer depends on the current time — server HTML would otherwise disagree
 * with the client at hydration.
 */
function useUpcomingScheduledPhase(): PhaseMeta | null {
  const [upcoming, setUpcoming] = useState<PhaseMeta | null>(null);
  useEffect(() => {
    const read = () => setUpcoming(getNextScheduledPhase());
    read();
    const timer = window.setInterval(read, PHASE_CLOCK.tickMs);
    return () => window.clearInterval(timer);
  }, []);
  return upcoming;
}

export function EventJourneyControl({
  phase,
  mode,
  onSelectPhase,
  onFollowClock,
}: {
  phase: EventPhase;
  mode: PhaseControlMode;
  onSelectPhase: (phase: EventPhase) => void;
  onFollowClock: () => void;
}) {
  const current = PHASE_META[phase];
  const next = getNextPhase(phase);
  const script = getAvatarScript(phase);
  const step = getPhaseIndex(phase) + 1;
  const total = PHASE_ORDER.length;
  const control = PHASE_CONTROL_META[mode];
  const isAuto = mode === PhaseControlMode.Auto;
  const upcoming = useUpcomingScheduledPhase();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="size-4 text-brand-blue" />
          Event journey
        </CardTitle>
        <CardDescription>
          Drive {AVATAR_NAME} for every attendee — change the phase and it updates
          live on their screens.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">
            Phase {step} of {total}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Who's driving the journey: the programme clock, or the host */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold",
                control.chip,
              )}
            >
              {isAuto ? <Clock className="size-3.5" /> : <Hand className="size-3.5" />}
              {control.label}
            </span>
            <p className="min-w-0 text-xs text-muted-foreground">
              {isAuto && upcoming
                ? `Moves to ${upcoming.label} at ${upcoming.time}, on its own.`
                : control.description}
            </p>
          </div>
          {!isAuto ? (
            <Button size="sm" variant="outline" onClick={onFollowClock}>
              <Clock className="size-4" />
              Follow the clock
            </Button>
          ) : null}
        </div>

        {/* Phase picker — jump to any phase, current emphasized */}
        <div className="flex flex-wrap gap-2">
          {PHASE_ORDER.map((p) => {
            const meta = PHASE_META[p];
            const state = getPhaseState(phase, p);
            const isCurrent = state === PhaseProgressState.Current;
            const isDone = state === PhaseProgressState.Done;
            const Icon = meta.icon;
            return (
              <button
                key={p}
                type="button"
                onClick={() => onSelectPhase(p)}
                aria-pressed={isCurrent}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                  isCurrent
                    ? "bg-brand-blue border-transparent text-white shadow-soft"
                    : isDone
                      ? "border-border/60 bg-muted text-muted-foreground hover:bg-muted/80"
                      : "border-border/70 hover:bg-muted/60",
                )}
              >
                {isDone ? <Check className="size-3.5" /> : <Icon className="size-3.5" />}
                {meta.shortLabel}
              </button>
            );
          })}
        </div>

        {/* What Navi is telling attendees right now */}
        <div className="rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            {AVATAR_NAME} now says · {current.label}
          </p>
          <p className="mt-0.5 text-sm font-medium leading-snug">{script.greeting}</p>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => next && onSelectPhase(next)}
          disabled={!next}
          className="bg-brand-gradient border-0 text-white hover:brightness-105"
        >
          {next ? `Advance to ${PHASE_META[next].label}` : "Journey complete"}
          <ArrowRight className="size-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
