import { GameStatus, GAME_CONFIG } from "@/constants/game";
import { RealtimeMessage } from "@/constants/realtime";
import type { EventPhase } from "@/constants/phases";
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
/** The latest event journey phase the host has set, replayed on connect. */
let currentPhase: EventPhase | null = null;
/** Latest score per player (keyed by device playerId) — the shared board. */
const scores = new Map<string, ScoreEntry>();
/**
 * Live presence: open SSE connections per distinct attendee device (keyed by
 * playerId). Refcounted because one attendee can hold several connections at
 * once (e.g. the navigator shell + the game screen, or two tabs); the headcount
 * is the number of distinct keys. The host connects without a playerId, so it is
 * never counted as an attendee.
 */
const presence = new Map<string, number>();

/**
 * Register a connected SSE client; returns an unsubscribe fn. An attendee passes
 * its device `playerId` so it is counted toward the live headcount (the host
 * omits it). Distinct-count changes are fanned out to everyone.
 */
export function addSubscriber(send: SseSend, playerId?: string): () => void {
  subscribers.add(send);
  const releasePresence = playerId ? acquirePresence(playerId) : () => {};
  return () => {
    subscribers.delete(send);
    releasePresence();
  };
}

/** The live count of distinct connected attendee devices, replayed on connect. */
export function getPresenceCount(): number {
  return presence.size;
}

/** Mark one connection present for a device; returns a release fn. Broadcasts on
 *  distinct-count changes (first connection in / last connection out). */
function acquirePresence(playerId: string): () => void {
  const before = presence.get(playerId) ?? 0;
  presence.set(playerId, before + 1);
  if (before === 0) broadcastPresence();
  return () => {
    const current = presence.get(playerId) ?? 0;
    if (current <= 1) {
      presence.delete(playerId);
      broadcastPresence();
    } else {
      presence.set(playerId, current - 1);
    }
  };
}

function broadcastPresence(): void {
  broadcast(RealtimeMessage.Presence, { count: presence.size });
}

/** The latest host snapshot, replayed to each newly-connected client. */
export function getCurrentState(): GameSessionState | null {
  return currentState;
}

/** The latest event journey phase, replayed to each newly-connected client. */
export function getCurrentPhase(): EventPhase | null {
  return currentPhase;
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

/** Host advanced the event journey → store it + fan out to everyone. */
export function publishPhase(phase: EventPhase): void {
  currentPhase = phase;
  broadcast(RealtimeMessage.Phase, { phase });
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
