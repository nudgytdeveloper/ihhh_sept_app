import {
  GameStatus,
  GAME_STATUS_META,
  LOBBY_CTA,
  type GameStatusMeta,
} from "@/constants/game";

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
