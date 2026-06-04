import { Timer, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { GAME_CONFIG } from "@/constants/game";
import { formatCountdown, formatScore } from "@/utils/format";

/**
 * Live round heads-up display: score (left), rank + countdown (right), and a
 * slim time-progress bar that turns urgent in the final seconds.
 */
export function GameHud({
  score,
  timeRemaining,
  rank,
}: {
  score: number;
  timeRemaining: number;
  rank: number;
}) {
  const lowTime = timeRemaining <= GAME_CONFIG.lowTimeThresholdSeconds;
  const timePct = Math.max(0, Math.min(1, timeRemaining / GAME_CONFIG.roundSeconds)) * 100;

  return (
    <div className="glass shadow-soft rounded-2xl border border-border/60 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-2xl font-bold leading-none tabular-nums">
            {formatScore(score)}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            points
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600">
            <Trophy className="size-3.5" />
            Rank #{rank}
          </span>
          <div className="flex items-center gap-1.5 text-right">
            <Timer
              className={cn("size-4", lowTime ? "text-rose-500" : "text-muted-foreground")}
            />
            <div>
              <p
                className={cn(
                  "font-mono text-2xl font-bold leading-none tabular-nums",
                  lowTime ? "text-rose-600" : "text-foreground",
                )}
              >
                {formatCountdown(timeRemaining)}
              </p>
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                left
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-1000 ease-linear",
            lowTime ? "bg-rose-500" : "bg-brand-gradient-cool",
          )}
          style={{ width: `${timePct}%` }}
        />
      </div>
    </div>
  );
}
