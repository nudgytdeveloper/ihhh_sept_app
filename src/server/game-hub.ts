import { GameStatus, GAME_CONFIG } from "@/constants/game";
import { RealtimeMessage } from "@/constants/realtime";
import type { GameSessionState, ScoreEntry } from "@/types";

/**
 * In-memory realtime hub (server-only). Holds the latest host session snapshot,
 * the aggregated shared leaderboard, and the set of connected SSE clients —
 * fanning host updates and live scores out to all of them.
 *
 * Intentionally NOT under `/utils`: that barrel is imported by client components,
 * and this module must never reach the client bundle. Single-instance — fine for
 * the demo on one Render web service; swap the Set/Map/state for Redis pub/sub if
 * the service is ever scaled to multiple instances.
 */

/** Sends one named SSE event to a single connected client. */
type SseSend = (event: string, data: unknown) => void;

const subscribers = new Set<SseSend>();
let currentState: GameSessionState | null = null;
/** Latest score per player (keyed by device playerId) — the shared board. */
const scores = new Map<string, ScoreEntry>();

/** Register a connected SSE client; returns an unsubscribe fn. */
export function addSubscriber(send: SseSend): () => void {
  subscribers.add(send);
  return () => subscribers.delete(send);
}

/** The latest host snapshot, replayed to each newly-connected client. */
export function getCurrentState(): GameSessionState | null {
  return currentState;
}

/** The current shared leaderboard (top N, highest first), replayed on connect. */
export function getLeaderboard(): ScoreEntry[] {
  return [...scores.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, GAME_CONFIG.leaderboardSize);
}

/** Host published a session snapshot → store it + fan out to everyone. */
export function publishState(state: GameSessionState): void {
  // Opening a fresh round (lobby / reset) clears the shared board for everyone.
  if (state.status === GameStatus.Lobby || state.status === GameStatus.Idle) {
    if (scores.size > 0) {
      scores.clear();
      broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
    }
  }
  currentState = state;
  broadcast(RealtimeMessage.State, state);
}

/** Attendee reported a live score → aggregate + fan the board out to everyone. */
export function submitScore(entry: ScoreEntry): void {
  // Frozen once the host locks the leaderboard for final tally.
  if (currentState?.locked) return;
  if (
    !entry ||
    typeof entry.playerId !== "string" ||
    typeof entry.name !== "string" ||
    typeof entry.score !== "number"
  ) {
    return;
  }
  scores.set(entry.playerId, {
    playerId: entry.playerId,
    name: entry.name,
    score: entry.score,
  });
  broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
}

/** Host pushed a one-off reminder → fan out (not stored). */
export function publishReminder(reminderId: string): void {
  broadcast(RealtimeMessage.Reminder, { reminderId });
}

function broadcast(event: string, data: unknown): void {
  for (const send of subscribers) {
    try {
      send(event, data);
    } catch {
      subscribers.delete(send);
    }
  }
}
