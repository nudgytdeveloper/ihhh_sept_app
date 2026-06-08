import {
  GameStatus,
  GAME_STATUS_META,
  LOBBY_CTA,
  type GameStatusMeta,
} from "@/constants/game";
import { EventPhase } from "@/constants/phases";
import { getInitials } from "@/utils/format";
import type { LeaderboardEntry, ScoreEntry } from "@/types";

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

/**
 * The single gate for entering the live round. Both must hold: the event journey
 * is at the Game Session phase AND the host has a live round running (Active /
 * Boss fight). Gates the lobby "join" CTA and the /game/play screen so attendees
 * can't drop into a round the host hasn't started — or has already ended.
 */
export function canEnterGame(phase: EventPhase, status: GameStatus): boolean {
  return phase === EventPhase.GameSession && isGameJoinable(status);
}

/** Attendee-facing copy for the locked round (lobby CTA + /game/play gate). */
export interface GameGateReason {
  /** Headline for the locked state. */
  title: string;
  /** One-line explanation under the headline. */
  description: string;
  /** Disabled-CTA label for the lobby action bar. */
  ctaLabel: string;
}

/**
 * Why the live round can't be entered, with copy. Only meaningful when
 * `canEnterGame` is false; covers the three blocked cases — the journey hasn't
 * reached the Game Session phase, the host hasn't started the round yet, or the
 * round has already wrapped.
 */
export function getGameGateReason(phase: EventPhase, status: GameStatus): GameGateReason {
  if (phase !== EventPhase.GameSession) {
    return {
      title: "It's not game time just yet",
      description: "Navi will call you in when the Game Session begins — hang tight!",
      ctaLabel: "Not game time yet",
    };
  }
  if (isGameOver(status)) {
    return {
      title: "That round has wrapped",
      description: "The game session is over — check out the final leaderboard.",
      ctaLabel: "Game over",
    };
  }
  // Game Session phase, but the host hasn't started the round yet (Idle / Lobby).
  return {
    title: "Waiting for the host to start",
    description: "The lobby is open — the round will kick off any moment now.",
    ctaLabel: "Waiting for the host…",
  };
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

/** Which host-control actions are available for a given game status (Screen 5). */
export interface HostControls {
  /** Begin the round (kick off play). */
  canStart: boolean;
  /** Send a wave of mini-viruses into the arena. */
  canSpawnWave: boolean;
  /** Unleash the COVID Boss with a required shape. */
  canSpawnBoss: boolean;
  /** Send the boss away and resume normal play. */
  canResumeRound: boolean;
  /** Freeze the leaderboard for final scoring. */
  canLock: boolean;
  /** Announce the winner. */
  canAnnounce: boolean;
  /** End the game. */
  canEnd: boolean;
}

export function getHostControls(status: GameStatus): HostControls {
  const live = status === GameStatus.Active;
  const boss = status === GameStatus.BossActive;
  return {
    canStart: status === GameStatus.Idle || status === GameStatus.Lobby,
    canSpawnWave: live,
    canSpawnBoss: live,
    canResumeRound: boss,
    canLock: live || boss || status === GameStatus.Ended,
    canAnnounce: status === GameStatus.Locked || status === GameStatus.Ended,
    canEnd: live || boss || status === GameStatus.Locked,
  };
}

/** The current leader (highest score) on a leaderboard. */
export function getWinner(leaderboard: LeaderboardEntry[]): LeaderboardEntry | undefined {
  return [...leaderboard].sort((a, b) => b.score - a.score)[0];
}

/* ----------------------- Shared live leaderboard ------------------------ */

/**
 * Turn the server's aggregated score entries (already sorted desc) into display
 * rows, numbering ranks and flagging the current device's own entry.
 */
export function toLeaderboard(entries: ScoreEntry[], currentPlayerId: string): LeaderboardEntry[] {
  return entries.map((entry, index) => ({
    rank: index + 1,
    attendeeId: entry.playerId,
    name: entry.name,
    initials: getInitials(entry.name),
    score: entry.score,
    isCurrentUser: entry.playerId === currentPlayerId,
  }));
}

/** Live rank for a score among the shared board: 1 + others scoring higher. */
export function getRankAmong(score: number, entries: ScoreEntry[], playerId: string): number {
  return 1 + entries.filter((entry) => entry.playerId !== playerId && entry.score > score).length;
}

/** How many other players on the shared board the given score is ahead of. */
export function getPlayersBeatenAmong(
  score: number,
  entries: ScoreEntry[],
  playerId: string,
): number {
  return entries.filter((entry) => entry.playerId !== playerId && entry.score < score).length;
}
