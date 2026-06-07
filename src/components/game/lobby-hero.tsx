import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MiniVirus } from "@/components/game/mini-virus";
import { cn } from "@/lib/utils";
import { GAME_NAME, GAME_CONFIG } from "@/constants/game";
import { EVENT_NAME } from "@/constants/app";
import { getGameStatusMeta } from "@/utils/game";
import type { GameSession, LeaderboardEntry } from "@/types";

/**
 * The energetic centerpiece of the lobby: game branding, live status, floating
 * mini-viruses, and a "who's in" headcount with stacked avatars. `playerCount` is
 * the live count of connected attendees (server-tracked); the faces are capped to
 * it so the avatars never outnumber the real headcount.
 */
export function LobbyHero({
  game,
  players,
  playerCount,
}: {
  game: GameSession;
  players: LeaderboardEntry[];
  playerCount: number;
}) {
  const statusMeta = getGameStatusMeta(game.status);
  const faces = players.slice(0, Math.min(5, playerCount));
  const extra = Math.max(playerCount - faces.length, 0);

  return (
    <Card className="relative overflow-hidden rounded-3xl border-0 p-0 shadow-soft-lg">
      <div className="bg-brand-gradient-cool relative overflow-hidden px-6 pb-6 pt-6 text-white">
        {/* Floating viruses (decorative) */}
        <div className="animate-bob pointer-events-none absolute -right-5 -top-5 size-28 opacity-90">
          <MiniVirus />
        </div>
        <div className="animate-float pointer-events-none absolute -bottom-2 right-20 size-12 opacity-60">
          <MiniVirus />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-white" />
          {statusMeta.label}
        </span>

        <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">
          {GAME_NAME}
        </h1>
        <p className="mt-1 text-sm text-white/85">
          Multiplayer · {GAME_CONFIG.roundSeconds}s round · {EVENT_NAME}
        </p>

        {/* Who's in */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-2">
            {faces.map((p) => (
              <Avatar
                key={p.attendeeId}
                className="size-8 ring-2 ring-white/70"
              >
                <AvatarFallback className="bg-white text-[11px] font-bold text-brand-blue">
                  {p.initials}
                </AvatarFallback>
              </Avatar>
            ))}
            {extra > 0 ? (
              <span className="grid size-8 place-items-center rounded-full bg-white/25 text-[11px] font-bold ring-2 ring-white/70 backdrop-blur">
                +{extra}
              </span>
            ) : null}
          </div>
          <div className="leading-tight">
            <p className="font-mono text-xl font-bold leading-none">
              {playerCount}
            </p>
            <p className={cn("text-xs text-white/85")}>online now</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
