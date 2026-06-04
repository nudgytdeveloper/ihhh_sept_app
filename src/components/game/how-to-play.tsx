import { Swords, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { MiniVirus } from "@/components/game/mini-virus";
import { cn } from "@/lib/utils";
import {
  GAME_CONFIG,
  BOSS_NAME,
  BOSS_SHAPES,
  SHAPE_META,
} from "@/constants/game";

/**
 * Pre-game rules card: tap viruses → beat the boss by drawing a shape → climb
 * the leaderboard. All numbers come from GAME_CONFIG (no inline magic values).
 */
export function HowToPlay() {
  return (
    <Card className="rounded-2xl border-border/60 p-5 shadow-soft">
      <h2 className="text-sm font-semibold">How to play</h2>

      <ol className="mt-4 space-y-4">
        <Step
          n={1}
          tone="bg-teal-500/10"
          tile={
            <span className="size-7">
              <MiniVirus />
            </span>
          }
          title="Tap the mini-viruses"
          desc={`Each one you pop is worth +${GAME_CONFIG.pointsPerVirus} points. Clear as many as you can before the timer runs out.`}
        />

        <Step
          n={2}
          tone="bg-rose-500/10 text-rose-600"
          tile={<Swords className="size-5" />}
          title={`Beat the ${BOSS_NAME}`}
          desc={`When the boss appears, draw the shape shown on screen to blast it for +${GAME_CONFIG.bossBonusPoints} bonus points.`}
        >
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BOSS_SHAPES.map((shape) => {
              const meta = SHAPE_META[shape];
              const ShapeIcon = meta.icon;
              return (
                <span
                  key={shape}
                  className="inline-flex items-center gap-1 rounded-lg bg-muted px-2 py-1 text-xs font-medium text-foreground"
                >
                  <ShapeIcon className="size-3.5" />
                  {meta.label}
                </span>
              );
            })}
          </div>
        </Step>

        <Step
          n={3}
          tone="bg-amber-500/10 text-amber-600"
          tile={<Trophy className="size-5" />}
          title="Climb the leaderboard"
          desc={`The top score when the ${GAME_CONFIG.roundSeconds}s round ends takes the crown.`}
        />
      </ol>
    </Card>
  );
}

function Step({
  n,
  tone,
  tile,
  title,
  desc,
  children,
}: {
  n: number;
  tone: string;
  tile: React.ReactNode;
  title: string;
  desc: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <div className="relative shrink-0">
        <div
          className={cn(
            "grid size-10 place-items-center rounded-xl",
            tone,
          )}
        >
          {tile}
        </div>
        <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background">
          {n}
        </span>
      </div>
      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        <p className="mt-0.5 text-pretty text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
        {children}
      </div>
    </li>
  );
}
