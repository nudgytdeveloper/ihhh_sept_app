import Link from "next/link";
import { ArrowRight, Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/navigator/reveal";
import {
  EventPhase,
  PHASE_META,
  PHASE_STATE_META,
  PhaseProgressState,
} from "@/constants/phases";
import { ActionIntent } from "@/constants/statuses";
import type { AvatarAction } from "@/constants/avatar-scripts";
import { getAvatarScript, getPhaseState } from "@/utils/event";
import type { ScheduleItem } from "@/types";

/**
 * Vertical phase timeline — one row per phase (done / current / upcoming). The
 * current phase is emphasized and carries the single next-action CTA, pulled
 * from the Avatar Script Engine so the timeline and the host stay in sync.
 */
export function ScheduleTimeline({
  items,
  currentPhase,
}: {
  items: ScheduleItem[];
  currentPhase: EventPhase;
}) {
  return (
    <section aria-label="Event timeline">
      <h2 className="px-1 text-sm font-semibold text-muted-foreground">
        Today&apos;s flow
      </h2>
      <ol className="mt-3">
        {items.map((item, i) => {
          const state = getPhaseState(currentPhase, item.phase);
          const action =
            state === PhaseProgressState.Current
              ? getAvatarScript(item.phase).action
              : undefined;
          return (
            <li key={item.phase}>
              <Reveal delay={120 + i * 70}>
                <ScheduleRow
                  item={item}
                  state={state}
                  isLast={i === items.length - 1}
                  action={action}
                />
              </Reveal>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ScheduleRow({
  item,
  state,
  isLast,
  action,
}: {
  item: ScheduleItem;
  state: PhaseProgressState;
  isLast: boolean;
  action?: AvatarAction;
}) {
  const meta = PHASE_META[item.phase];
  const stateMeta = PHASE_STATE_META[state];
  const Icon = meta.icon;

  const isCurrent = state === PhaseProgressState.Current;
  const isDone = state === PhaseProgressState.Done;
  const isPrimaryAction = action?.intent === ActionIntent.Primary;

  return (
    <div
      className={cn(
        "relative grid grid-cols-[2.75rem_minmax(0,1fr)] gap-3",
        isLast ? "pb-0" : "pb-5",
      )}
    >
      {/* Rail connector — runs from this node down to the next; teal once done */}
      {!isLast ? (
        <span
          aria-hidden
          className={cn(
            "absolute left-[1.375rem] bottom-0 top-11 w-0.5 -translate-x-1/2 rounded-full",
            isDone ? "bg-teal-400" : "bg-border",
          )}
        />
      ) : null}

      {/* Node */}
      <div className="relative z-10 flex justify-center">
        <div className="relative">
          {isCurrent ? (
            <span
              aria-hidden
              className="animate-pulse-ring absolute inset-0 rounded-full ring-2 ring-teal-400/40"
            />
          ) : null}
          <div
            className={cn(
              "grid size-10 place-items-center rounded-full",
              isCurrent
                ? cn("bg-gradient-to-br text-white shadow-soft", meta.accent.gradient)
                : isDone
                  ? "bg-teal-500 text-white"
                  : "border-2 border-border bg-background text-muted-foreground",
            )}
          >
            {isDone ? (
              <Check className="size-4" strokeWidth={3} />
            ) : (
              <Icon className="size-[1.1rem]" strokeWidth={2.2} />
            )}
          </div>
        </div>
      </div>

      {/* Card */}
      <div
        className={cn(
          "rounded-2xl border p-4 transition",
          isCurrent
            ? "border-teal-500/30 bg-teal-500/5 shadow-soft"
            : isDone
              ? "border-border/50 bg-card/50"
              : "border-border/60 bg-card",
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <h3
            className={cn(
              "font-semibold leading-tight",
              isCurrent ? "text-base" : "text-sm",
              isDone ? "text-foreground/70" : "text-foreground",
            )}
          >
            {item.title}
          </h3>
          <span className="inline-flex shrink-0 items-center gap-1 font-mono text-xs text-muted-foreground">
            <Clock className="size-3" />
            {item.time}
          </span>
        </div>

        <p
          className={cn(
            "mt-1 text-pretty text-sm leading-relaxed",
            isDone ? "text-muted-foreground/80" : "text-muted-foreground",
          )}
        >
          {item.description}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold",
              stateMeta.chip,
            )}
          >
            {isCurrent ? (
              <span className="size-1.5 animate-pulse rounded-full bg-teal-500" />
            ) : null}
            {stateMeta.label}
          </span>

          {action ? (
            <Button
              asChild
              size="sm"
              variant={isPrimaryAction ? "default" : "outline"}
              className={cn(
                "h-8 rounded-lg px-3 text-xs font-semibold",
                isPrimaryAction &&
                  "bg-brand-gradient border-0 text-white shadow-soft transition hover:brightness-105",
              )}
            >
              <Link href={action.href}>
                {action.label}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
