import { Route, ArrowRight, Check } from "lucide-react";
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
  PhaseProgressState,
} from "@/constants/phases";
import { getAvatarScript, getNextPhase, getPhaseIndex, getPhaseState } from "@/utils/event";

/**
 * Host control for the event journey. Picking a phase (or advancing to the next)
 * drives Navi for every attendee live — the home hero, journey track, and
 * schedule all react to the broadcast phase. Independent of the game round.
 */
export function EventJourneyControl({
  phase,
  onSelectPhase,
}: {
  phase: EventPhase;
  onSelectPhase: (phase: EventPhase) => void;
}) {
  const current = PHASE_META[phase];
  const next = getNextPhase(phase);
  const script = getAvatarScript(phase);
  const step = getPhaseIndex(phase) + 1;
  const total = PHASE_ORDER.length;

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
