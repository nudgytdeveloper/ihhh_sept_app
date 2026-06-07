import Link from "next/link";
import { ArrowRight, Trophy, Users, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MiniVirus } from "@/components/game/mini-virus";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { GAME_NAME, GAME_CONFIG, GameStatus } from "@/constants/game";
import { formatScore } from "@/utils/format";
import type { GameSession, LeaderboardEntry } from "@/types";

const RANK_BADGE: Record<number, string> = {
  1: "bg-amber-400 text-amber-950",
  2: "bg-slate-300 text-slate-800",
  3: "bg-orange-400 text-orange-950",
};

const LIVE_STATUSES = new Set<GameStatus>([
  GameStatus.Lobby,
  GameStatus.Active,
  GameStatus.BossActive,
]);

/**
 * Game session entry point for the navigator home. Previews the live Virus
 * Fight session (status, who's online, leaderboard peek) and routes to the lobby.
 * Intentionally NOT the game itself — that lives on /game/play. `playerCount` is
 * the live count of connected attendees (server-tracked).
 */
export function GamePreviewCard({
  game,
  leaderboard,
  playerCount,
}: {
  game: GameSession;
  leaderboard: LeaderboardEntry[];
  playerCount: number;
}) {
  const isLive = LIVE_STATUSES.has(game.status);
  const top = leaderboard.slice(0, 3);
  const me = leaderboard.find((e) => e.isCurrentUser);
  const meInTop = me ? me.rank <= 3 : false;

  return (
    <Card className="overflow-hidden rounded-2xl border-border/60 p-0 shadow-soft">
      {/* Banner */}
      <div className="bg-brand-gradient-cool relative overflow-hidden px-5 pb-4 pt-5 text-white">
        <div className="animate-bob absolute -right-3 -top-3 size-24 opacity-90">
          <MiniVirus />
        </div>

        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-white" />
              Live
            </span>
          ) : null}
        </div>

        <h2 className="mt-2 font-heading text-2xl font-bold">{GAME_NAME}</h2>
        <p className="mt-0.5 max-w-[16rem] text-sm text-white/85">
          Multiplayer mini-game — tap the viruses, climb the leaderboard.
        </p>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={Users} value={`${playerCount}`} label="online" />
          <Stat
            icon={Timer}
            value={`${GAME_CONFIG.roundSeconds}s`}
            label="per round"
          />
          <Stat
            icon={Trophy}
            value={me ? `#${me.rank}` : "—"}
            label="your rank"
          />
        </div>
      </div>

      {/* Leaderboard peek */}
      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Live leaderboard</p>
          <p className="text-xs text-muted-foreground">Top players right now</p>
        </div>

        <ul className="space-y-1.5">
          {top.map((entry) => (
            <LeaderRow key={entry.attendeeId} entry={entry} />
          ))}
          {me && !meInTop ? (
            <>
              <li className="px-2 text-center text-xs text-muted-foreground">
                ···
              </li>
              <LeaderRow entry={me} />
            </>
          ) : null}
        </ul>

        <Button
          asChild
          size="lg"
          className="bg-brand-gradient-cool h-12 w-full rounded-xl border-0 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
        >
          <Link href={ROUTES.GAME_LOBBY}>
            Enter the Game Lobby
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function Stat({
  icon: Icon,
  value,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-1 text-white/80">
        <Icon className="size-3.5" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="mt-0.5 font-mono text-lg font-bold leading-none">{value}</p>
    </div>
  );
}

function LeaderRow({ entry }: { entry: LeaderboardEntry }) {
  return (
    <li
      className={cn(
        "flex items-center gap-3 rounded-xl px-2.5 py-2 transition",
        entry.isCurrentUser
          ? "bg-brand-blue/8 ring-1 ring-brand-blue/20"
          : "hover:bg-muted/60",
      )}
    >
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-md text-xs font-bold",
          RANK_BADGE[entry.rank] ?? "bg-muted text-muted-foreground",
        )}
      >
        {entry.rank}
      </span>
      <Avatar className="size-7">
        <AvatarFallback className="bg-secondary text-[11px] font-semibold">
          {entry.initials}
        </AvatarFallback>
      </Avatar>
      <span className="flex-1 truncate text-sm font-medium">
        {entry.name}
        {entry.isCurrentUser ? (
          <span className="ml-1.5 text-xs font-semibold text-brand-blue">
            You
          </span>
        ) : null}
      </span>
      <span className="font-mono text-sm font-semibold tabular-nums">
        {formatScore(entry.score)}
      </span>
    </li>
  );
}
