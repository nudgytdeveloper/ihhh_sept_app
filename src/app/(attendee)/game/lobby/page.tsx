import Link from "next/link";
import { ArrowRight, ChevronLeft } from "lucide-react";
import { LobbyHero } from "@/components/game/lobby-hero";
import { LobbyCoach } from "@/components/game/lobby-coach";
import { HowToPlay } from "@/components/game/how-to-play";
import { Reveal } from "@/components/navigator/reveal";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { getGameStatusMeta, getLobbyCtaLabel } from "@/utils/game";
import { MOCK_ATTENDEE, MOCK_EVENT_STATE, MOCK_LEADERBOARD } from "@/data/event";

export const metadata = { title: "Game Lobby" };

/**
 * Screen 3 — Game Lobby. Navi coaches the attendee, the rules are laid out, and
 * a single status-aware CTA (driven by GameStatus) leads into the arena.
 */
export default function GameLobbyPage() {
  const { game } = MOCK_EVENT_STATE;
  const firstName = MOCK_ATTENDEE.name.split(" ")[0];
  const statusMeta = getGameStatusMeta(game.status);
  const ctaLabel = getLobbyCtaLabel(game.status);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-4 pt-6">
      <Reveal delay={0}>
        <LobbyHero game={game} players={MOCK_LEADERBOARD} />
      </Reveal>

      <Reveal delay={90}>
        <LobbyCoach name={firstName} />
      </Reveal>

      <Reveal delay={180}>
        <HowToPlay />
      </Reveal>

      <div className="flex justify-center pt-1">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground"
        >
          <Link href={ROUTES.HOME}>
            <ChevronLeft className="size-4" />
            Back to home
          </Link>
        </Button>
      </div>

      {/* Sticky action bar — the single obvious next step */}
      <div className="glass sticky bottom-0 z-20 -mx-4 mt-2 border-t border-border/60 px-4 pb-4 pt-3">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold">
              <span
                className={cn(
                  "size-1.5 animate-pulse rounded-full",
                  statusMeta.dot,
                )}
              />
              {statusMeta.label}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {statusMeta.description}
            </p>
          </div>
          <Button
            asChild
            size="lg"
            className="bg-brand-gradient h-12 shrink-0 rounded-xl border-0 px-5 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
          >
            <Link href={ROUTES.GAME_PLAY}>
              {ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
