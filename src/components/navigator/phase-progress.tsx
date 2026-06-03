import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { EventPhase, PHASE_ORDER, PHASE_META } from "@/constants/phases";
import { getPhaseIndex, getNextPhase, getPhaseProgress } from "@/utils/event";

/**
 * A compact peek at the event journey: an overall progress track with a node
 * per phase (done / now / upcoming), plus "Now" and "Up next" callouts.
 */
export function PhaseProgress({ phase }: { phase: EventPhase }) {
  const currentIndex = getPhaseIndex(phase);
  const progress = getPhaseProgress(phase);
  const current = PHASE_META[phase];
  const nextPhase = getNextPhase(phase);
  const next = nextPhase ? PHASE_META[nextPhase] : null;

  return (
    <Card className="gap-0 rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your event journey</h2>
        <Link
          href={ROUTES.SCHEDULE}
          className="inline-flex items-center gap-0.5 text-xs font-medium text-brand-blue transition hover:opacity-80"
        >
          Full schedule
          <ChevronRight className="size-3.5" />
        </Link>
      </div>

      {/* Progress track with phase nodes */}
      <div className="relative mt-5 px-1">
        <div className="h-1.5 rounded-full bg-muted" />
        <div
          className="bg-brand-gradient-cool absolute inset-y-0 left-0 top-0 h-1.5 rounded-full"
          style={{ width: `${progress * 100}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-between">
          {PHASE_ORDER.map((p, i) => {
            const meta = PHASE_META[p];
            const isDone = i < currentIndex;
            const isCurrent = i === currentIndex;
            const Icon = meta.icon;
            return (
              <div
                key={p}
                className={cn(
                  "grid place-items-center rounded-full transition",
                  isCurrent
                    ? "size-7 bg-white shadow-soft ring-2 ring-teal-500"
                    : isDone
                      ? "size-4 bg-teal-500 text-white"
                      : "size-4 border-2 border-border bg-background",
                )}
                title={meta.label}
              >
                {isCurrent ? (
                  <Icon className="size-4 text-teal-600" strokeWidth={2.4} />
                ) : isDone ? (
                  <Check className="size-2.5" strokeWidth={3} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Now / Up next */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <PhaseCallout
          label="Now"
          phaseLabel={current.label}
          time={current.time}
          accent={current.accent.soft}
          IconCmp={current.icon}
          highlight
        />
        {next ? (
          <PhaseCallout
            label="Up next"
            phaseLabel={next.label}
            time={next.time}
            accent={next.accent.soft}
            IconCmp={next.icon}
          />
        ) : (
          <div className="grid place-items-center rounded-xl border border-dashed border-border/70 text-xs text-muted-foreground">
            You&apos;re all done 🎉
          </div>
        )}
      </div>
    </Card>
  );
}

function PhaseCallout({
  label,
  phaseLabel,
  time,
  accent,
  IconCmp,
  highlight,
}: {
  label: string;
  phaseLabel: string;
  time: string;
  accent: string;
  IconCmp: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3",
        highlight ? "border-teal-500/30 bg-teal-500/5" : "border-border/60",
      )}
    >
      <div
        className={cn(
          "grid size-9 shrink-0 place-items-center rounded-lg",
          accent,
        )}
      >
        <IconCmp className="size-4.5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-semibold">{phaseLabel}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}
