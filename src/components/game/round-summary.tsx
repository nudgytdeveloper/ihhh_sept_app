import Link from "next/link";
import { RotateCcw, Home, Trophy, Users, Swords } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { AvatarMood } from "@/constants/statuses";
import { GAME_CONFIG } from "@/constants/game";
import { GAME_SCRIPTS } from "@/constants/avatar-scripts";
import { formatScore, template } from "@/utils/format";

/**
 * End-of-round overlay: Navi celebrates, the final score headlines, and stat
 * chips summarize the run. Primary CTA replays; secondary returns home.
 */
export function RoundSummary({
  name,
  score,
  rank,
  playersBeaten,
  bossDefeated,
  onReplay,
}: {
  name: string;
  score: number;
  rank: number;
  playersBeaten: number;
  bossDefeated: boolean;
  onReplay: () => void;
}) {
  return (
    <div className="animate-in fade-in absolute inset-0 z-50 grid place-items-center bg-white/70 px-5 backdrop-blur-md">
      <Card className="animate-in zoom-in-95 w-full max-w-sm rounded-3xl border-0 p-6 text-center shadow-soft-lg">
        <AvatarHost mood={AvatarMood.Celebrating} className="mx-auto size-20" />
        <h2 className="mt-3 text-xl font-bold">Round complete!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {template(GAME_SCRIPTS.gameOver, { name })}
        </p>

        <p className="text-gradient-brand mt-5 font-mono text-5xl font-bold tabular-nums">
          {formatScore(score)}
        </p>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          final score
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <Chip icon={Trophy} tone="bg-amber-500/10 text-amber-600">
            Rank #{rank}
          </Chip>
          <Chip icon={Users} tone="bg-teal-500/10 text-teal-600">
            Beat {playersBeaten} players
          </Chip>
          {bossDefeated ? (
            <Chip icon={Swords} tone="bg-rose-500/10 text-rose-600">
              +{formatScore(GAME_CONFIG.bossBonusPoints)} boss bonus
            </Chip>
          ) : null}
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <Button
            onClick={onReplay}
            size="lg"
            className="bg-brand-gradient h-12 rounded-xl border-0 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
          >
            <RotateCcw className="size-4" />
            Play again
          </Button>
          <Button asChild variant="ghost" className="rounded-xl text-muted-foreground">
            <Link href={ROUTES.HOME}>
              <Home className="size-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

function Chip({
  icon: Icon,
  tone,
  children,
}: {
  icon: typeof Trophy;
  tone: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        tone,
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </span>
  );
}
