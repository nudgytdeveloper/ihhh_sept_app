import { Trophy, Lock, Crown, Users } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { formatScore } from "@/utils/format";
import type { HostControls } from "@/utils/game";
import type { LeaderboardEntry } from "@/types";

/** Rank-badge colors for the top three places. */
const MEDAL = ["text-amber-500", "text-slate-400", "text-orange-600"];

/**
 * Live leaderboard with a lock toggle and winner announcement. Locking freezes
 * scores for final tally; announcing crowns the current leader.
 */
export function HostLeaderboard({
  leaderboard,
  locked,
  controls,
  winner,
  playerCount,
  onLock,
  onAnnounce,
}: {
  leaderboard: LeaderboardEntry[];
  locked: boolean;
  controls: HostControls;
  winner: LeaderboardEntry | null;
  playerCount: number;
  onLock: () => void;
  onAnnounce: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="size-4 text-amber-500" />
          Live leaderboard
        </CardTitle>
        <CardDescription>
          {playerCount > 0
            ? `${playerCount} ${playerCount === 1 ? "player" : "players"} on the board`
            : "Live scores from attendees"}
        </CardDescription>
        <CardAction>
          <Badge variant={locked ? "secondary" : "outline"} className="gap-1">
            <span
              className={cn(
                "size-1.5 rounded-full",
                locked ? "bg-indigo-500" : "animate-pulse bg-emerald-500",
              )}
            />
            {locked ? "Locked" : "Live"}
          </Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-0.5">
        {leaderboard.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-10 text-center">
            <Users className="size-7 text-muted-foreground/50" />
            <p className="text-sm font-medium">Waiting for players…</p>
            <p className="max-w-[16rem] text-xs text-muted-foreground">
              Scores appear here live as attendees tap viruses and beat the boss.
            </p>
          </div>
        ) : null}
        {leaderboard.map((entry, i) => {
          const isWinner = winner ? winner.attendeeId === entry.attendeeId : false;
          return (
            <div
              key={entry.attendeeId}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1.5",
                entry.isCurrentUser && "bg-brand-blue/5",
                isWinner && "bg-amber-500/10 ring-1 ring-amber-500/30",
              )}
            >
              <span
                className={cn(
                  "w-5 shrink-0 text-center font-mono text-sm font-bold",
                  MEDAL[i] ?? "text-muted-foreground",
                )}
              >
                {entry.rank}
              </span>
              <Avatar className="size-7">
                <AvatarFallback className="bg-muted text-[11px] font-semibold">
                  {entry.initials}
                </AvatarFallback>
              </Avatar>
              <p className="flex min-w-0 flex-1 items-center gap-1.5 truncate text-sm font-medium">
                {entry.name}
                {entry.isCurrentUser ? (
                  <span className="text-xs text-muted-foreground">· You</span>
                ) : null}
                {isWinner ? (
                  <Badge className="gap-0.5 bg-amber-500 text-white">
                    <Crown className="size-2.5" />
                    Winner
                  </Badge>
                ) : null}
              </p>
              <span className="font-mono text-sm font-semibold tabular-nums">
                {formatScore(entry.score)}
              </span>
            </div>
          );
        })}
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" onClick={onLock} disabled={!controls.canLock || locked}>
          <Lock className="size-4" />
          {locked ? "Locked" : "Lock leaderboard"}
        </Button>
        <Button
          onClick={onAnnounce}
          disabled={!controls.canAnnounce}
          className="bg-amber-500 text-white hover:bg-amber-600"
        >
          <Trophy className="size-4" />
          Announce winner
        </Button>
      </CardFooter>
    </Card>
  );
}
