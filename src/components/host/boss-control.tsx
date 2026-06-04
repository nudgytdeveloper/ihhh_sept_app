import { Swords, Crown } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BOSS_SHAPES, SHAPE_META, BOSS_NAME, GAME_CONFIG, BossShape } from "@/constants/game";
import { formatScore } from "@/utils/format";
import type { HostControls } from "@/utils/game";

/**
 * COVID Boss control: pick the shape attendees must draw, then unleash the boss
 * (Active → BossActive). "Resume round" sends it away (BossActive → Active).
 */
export function BossControl({
  controls,
  selectedShape,
  activeBossShape,
  onSelectShape,
  onSpawnBoss,
  onResume,
}: {
  controls: HostControls;
  selectedShape: BossShape;
  activeBossShape: BossShape | null;
  onSelectShape: (shape: BossShape) => void;
  onSpawnBoss: (shape: BossShape) => void;
  onResume: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="size-4 text-rose-500" />
          {BOSS_NAME}
        </CardTitle>
        <CardDescription>
          Pick a shape, then unleash the boss for +{formatScore(GAME_CONFIG.bossBonusPoints)} bonus.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {BOSS_SHAPES.map((shape) => {
            const meta = SHAPE_META[shape];
            const Icon = meta.icon;
            const active = shape === selectedShape;
            return (
              <button
                key={shape}
                type="button"
                aria-pressed={active}
                onClick={() => onSelectShape(shape)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs font-medium transition",
                  active
                    ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                    : "border-border text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-5" />
                {meta.label}
              </button>
            );
          })}
        </div>

        {activeBossShape ? (
          <p className="flex items-center gap-1.5 rounded-lg bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-600">
            <Crown className="size-3.5" />
            Boss live — attendees are drawing the {SHAPE_META[activeBossShape].label.toLowerCase()}.
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="gap-2">
        <Button
          onClick={() => onSpawnBoss(selectedShape)}
          disabled={!controls.canSpawnBoss}
          className="bg-rose-500 text-white hover:bg-rose-600"
        >
          <Swords className="size-4" />
          Spawn boss
        </Button>
        <Button variant="outline" onClick={onResume} disabled={!controls.canResumeRound}>
          Resume round
        </Button>
      </CardFooter>
    </Card>
  );
}
