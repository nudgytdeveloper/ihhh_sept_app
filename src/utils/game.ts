import {
  GameStatus,
  GAME_STATUS_META,
  LOBBY_CTA,
  type GameStatusMeta,
} from "@/constants/game";
import type { LeaderboardEntry } from "@/types";

/** Display metadata for a game lifecycle state. */
export function getGameStatusMeta(status: GameStatus): GameStatusMeta {
  return GAME_STATUS_META[status];
}

/** Whether the round is live to play (Active / Boss fight). */
export function isGameJoinable(status: GameStatus): boolean {
  return GAME_STATUS_META[status].joinable;
}

/** Whether the game has finished (round locked or ended). */
export function isGameOver(status: GameStatus): boolean {
  return status === GameStatus.Locked || status === GameStatus.Ended;
}

/** The lobby's primary-CTA label for the current game status. */
export function getLobbyCtaLabel(status: GameStatus): string {
  if (isGameJoinable(status)) return LOBBY_CTA.live;
  if (isGameOver(status)) return LOBBY_CTA.ended;
  return LOBBY_CTA.waiting;
}

/** Other players on the board (the current user's static entry is excluded). */
function others(leaderboard: LeaderboardEntry[]): LeaderboardEntry[] {
  return leaderboard.filter((entry) => !entry.isCurrentUser);
}

/**
 * Live rank for a score, as if it were inserted into the board: 1 + the number
 * of other players scoring higher. Used for the in-round "Rank #n" readout.
 */
export function getLiveRank(score: number, leaderboard: LeaderboardEntry[]): number {
  return 1 + others(leaderboard).filter((entry) => entry.score > score).length;
}

/** How many other players the given score is currently ahead of. */
export function getPlayersBeaten(score: number, leaderboard: LeaderboardEntry[]): number {
  return others(leaderboard).filter((entry) => entry.score < score).length;
}
