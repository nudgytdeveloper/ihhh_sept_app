import Link from "next/link";
import { ChevronLeft, Home } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";
import { GameStatus } from "@/constants/game";
import { AvatarMood } from "@/constants/statuses";
import { getGameGateReason, isGameOver } from "@/utils/game";
import type { EventPhase } from "@/constants/phases";

/**
 * Shown on /game/play when the live round can't be entered (see `canEnterGame`):
 * the journey hasn't reached the Game Session phase, the host hasn't started the
 * round, or it's already over. Navi-led, with a single way back — so attendees
 * never land in a playable arena the host hasn't opened.
 */
export function GameLocked({
  phase,
  status,
}: {
  phase: EventPhase;
  status: GameStatus;
}) {
  const reason = getGameGateReason(phase, status);
  const mood = isGameOver(status) ? AvatarMood.Relaxed : AvatarMood.Guiding;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-16 text-center">
      <AvatarHost mood={mood} className="size-24 animate-float" />

      <div className="space-y-1.5">
        <h1 className="font-heading text-2xl font-bold">{reason.title}</h1>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          {reason.description}
        </p>
      </div>

      <div className="flex flex-col items-center gap-2">
        <Button
          asChild
          size="lg"
          className="bg-brand-gradient h-12 rounded-xl border-0 px-6 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
        >
          <Link href={ROUTES.GAME_LOBBY}>
            <ChevronLeft className="size-4" />
            Back to the lobby
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="rounded-full text-muted-foreground">
          <Link href={ROUTES.HOME}>
            <Home className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>
    </div>
  );
}
