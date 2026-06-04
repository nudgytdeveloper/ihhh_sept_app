import { Play, Square, RotateCcw, Users, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GameStatus, BossShape, SHAPE_META } from "@/constants/game";
import { getGameStatusMeta, type HostControls } from "@/utils/game";

/**
 * The control room's "now playing" bar: current game status (driven by
 * GameStatus / GAME_STATUS_META) plus the primary flow controls. Buttons stay
 * visible and enable/disable by status, like a real operator console.
 */
export function HostStatusBanner({
  status,
  controls,
  playerCount,
  waves,
  activeBossShape,
  onStart,
  onEnd,
  onReset,
}: {
  status: GameStatus;
  controls: HostControls;
  playerCount: number;
  waves: number;
  activeBossShape: BossShape | null;
  onStart: () => void;
  onEnd: () => void;
  onReset: () => void;
}) {
  const meta = getGameStatusMeta(status);
  const BossIcon = activeBossShape ? SHAPE_META[activeBossShape].icon : null;

  return (
    <Card className="p-0">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="relative mt-1.5 flex size-3 shrink-0">
            <span className={cn("absolute inline-flex size-full animate-ping rounded-full opacity-50", meta.dot)} />
            <span className={cn("relative inline-flex size-3 rounded-full", meta.dot)} />
          </span>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Game status
            </p>
            <h1 className="font-heading text-2xl font-bold leading-tight">{meta.label}</h1>
            <p className="text-sm text-muted-foreground">{meta.description}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Stat icon={Users}>{playerCount} players</Stat>
              <Stat icon={Zap}>{waves} sent</Stat>
              {BossIcon && activeBossShape ? (
                <Stat icon={BossIcon} tone="bg-rose-500/10 text-rose-600">
                  Boss · {SHAPE_META[activeBossShape].label}
                </Stat>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={onStart}
            disabled={!controls.canStart}
            className="bg-brand-gradient border-0 text-white shadow-soft hover:brightness-105"
          >
            <Play className="size-4" />
            Start round
          </Button>
          <Button variant="destructive" onClick={onEnd} disabled={!controls.canEnd}>
            <Square className="size-4" />
            End game
          </Button>
          <Button variant="ghost" onClick={onReset} className="text-muted-foreground">
            <RotateCcw className="size-4" />
            Reset
          </Button>
        </div>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Users;
  tone?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-foreground",
        tone,
      )}
    >
      <Icon className="size-3" />
      {children}
    </span>
  );
}
