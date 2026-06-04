import { AvatarHost } from "@/components/navigator/avatar-host";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AVATAR_NAME } from "@/constants/app";
import { EventPhase, PHASE_ORDER, PHASE_META } from "@/constants/phases";
import { SCHEDULE_INTRO } from "@/constants/avatar-scripts";
import { getAvatarScript, getPhaseIndex, getPhaseProgress } from "@/utils/event";
import { template } from "@/utils/format";

/**
 * Schedule hero: a compact Navi guide presence + a day-at-a-glance progress
 * summary. Orients the attendee before the detailed timeline below — the
 * avatar still leads, in keeping with the product direction.
 */
export function ScheduleOverview({
  phase,
  name,
}: {
  phase: EventPhase;
  name: string;
}) {
  const script = getAvatarScript(phase);
  const current = PHASE_META[phase];
  const CurrentIcon = current.icon;
  const total = PHASE_ORDER.length;
  const step = getPhaseIndex(phase) + 1;
  const progress = getPhaseProgress(phase);
  const intro = template(SCHEDULE_INTRO, { name, phase: current.label });

  return (
    <Card className="gap-0 overflow-hidden rounded-3xl border-border/60 p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <AvatarHost mood={script.mood} className="size-16 shrink-0" />
        <div className="min-w-0 pt-0.5">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-muted-foreground">
              {AVATAR_NAME} · your guide
            </span>
          </span>
          <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
            Event Schedule
          </h1>
        </div>
      </div>

      <p className="mt-3 text-pretty text-sm leading-relaxed text-muted-foreground">
        {intro}
      </p>

      {/* Day progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-foreground">
            Phase {step} of {total}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-medium",
              current.accent.text,
            )}
          >
            <CurrentIcon className="size-3.5" />
            Now · {current.label}
          </span>
        </div>
        <div className="relative mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className="bg-brand-gradient-cool absolute inset-y-0 left-0 rounded-full"
            style={{ width: `${Math.max(progress * 100, 6)}%` }}
          />
        </div>
      </div>
    </Card>
  );
}
