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
/**
 * Scores accumulate across rounds: a player's board total is their banked total
 * from finished rounds plus whatever they've scored in the round running now.
 *
 * `roundScores` holds the live round (the attendee re-reports a running total,
 * so the latest report replaces the previous one — never added, or the throttled
 * flushes would double-count). Resetting the session banks each round score into
 * `totals` and clears the round, so a reset never costs anyone their points.
 * Only "clear all game data" wipes `totals`.
 */
const totals = new Map<string, number>();
const roundScores = new Map<string, ScoreEntry>();
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

/** A player's event total: everything banked plus the round running now. */
function totalFor(playerId: string): number {
  return (totals.get(playerId) ?? 0) + (roundScores.get(playerId)?.score ?? 0);
}

/** Every player who has ever scored this event (banked or in the live round). */
function scoringPlayerIds(): Set<string> {
  return new Set([...totals.keys(), ...roundScores.keys()]);
}

/** Display name for a player — the live round's is freshest, else the banked one. */
const names = new Map<string, string>();

/** The current shared leaderboard (top N, highest first), replayed on connect. */
export function getLeaderboard(): ScoreEntry[] {
  return [...scoringPlayerIds()]
    .map((playerId) => ({
      playerId,
      name: names.get(playerId) ?? "",
      score: totalFor(playerId),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, GAME_CONFIG.leaderboardSize);
}

/**
 * Bank the live round into each player's running total and clear the round.
 * Called when the host opens a fresh round — scores survive a session reset,
 * which is the whole point of the cumulative model.
 */
function bankRound(): void {
  if (roundScores.size === 0) return;
  for (const [playerId, entry] of roundScores) {
    totals.set(playerId, (totals.get(playerId) ?? 0) + entry.score);
  }
  roundScores.clear();
}

/** Host published a session snapshot → store it + fan out to everyone. */
export function publishState(state: GameSessionState): void {
  // Opening a fresh round banks the round just played; nobody loses points.
  if (state.status === GameStatus.Lobby || state.status === GameStatus.Idle) {
    bankRound();
    broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
  }
  currentState = state;
  broadcast(RealtimeMessage.State, state);
}

/**
 * Attendee reported a live score → aggregate + fan the board out to everyone.
 * Returns the player's new event total when accepted (so the publish route
 * persists that, not the round score), or null when rejected — the board is
 * locked for final tally, or the payload is malformed.
 */
export function submitScore(entry: ScoreEntry): number | null {
  // Frozen once the host locks the leaderboard for final tally.
  if (currentState?.locked) return null;
  if (
    !entry ||
    typeof entry.playerId !== "string" ||
    typeof entry.name !== "string" ||
    typeof entry.score !== "number" ||
    !Number.isFinite(entry.score)
  ) {
    return null;
  }
  names.set(entry.playerId, entry.name);
  roundScores.set(entry.playerId, {
    playerId: entry.playerId,
    name: entry.name,
    score: entry.score,
  });
  broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
  return totalFor(entry.playerId);
}

/**
 * Seed the banked totals from Postgres, so a server restart doesn't silently
 * reset everyone to zero and leave the live board disagreeing with the roster.
 *
 * Deliberately lazy rather than run from `instrumentation.ts`: that hook
 * executes in its own module instance, so seeding there populates a *different*
 * copy of this module than the route handlers use. Both realtime routes await
 * this instead, which guarantees the instance that serves traffic is the one
 * that gets the data. Runs at most once; a failure is retried on the next call.
 */
let hydration: Promise<void> | null = null;

export function ensureScoresHydrated(): Promise<void> {
  hydration ??= loadTotals().catch((error) => {
    console.error("[scores] hydrate failed", error);
    hydration = null; // let the next request try again
  });
  return hydration;
}

async function loadTotals(): Promise<void> {
  const { getDb } = await import("@/server/db");
  const db = getDb();
  if (!db) return;
  const { listAllScores } = await import("@/server/db/scores");
  const rows = await listAllScores(db);
  for (const row of rows) {
    if (typeof row.playerId !== "string" || typeof row.score !== "number") continue;
    // A round already in flight wins — never clobber live play with a stale row.
    if (!totals.has(row.playerId)) totals.set(row.playerId, row.score);
    if (row.name && !names.has(row.playerId)) names.set(row.playerId, row.name);
  }
  if (rows.length > 0) {
    console.log(`[scores] restored ${rows.length} attendee total(s) from the database`);
    broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
  }
}

/**
 * Host wiped every score for the event — banked totals and the live round. The
 * caller is responsible for clearing the persisted rows too.
 */
export function clearAllScores(): void {
  totals.clear();
  roundScores.clear();
  names.clear();
  broadcast(RealtimeMessage.Leaderboard, getLeaderboard());
}

/** Device playerIds currently connected — the roster's "online now" dots. */
export function getOnlinePlayerIds(): string[] {
  return [...presence.keys()];
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

/** Host fired a synchronized pre-round countdown → fan out (one-off, not stored). */
export function publishCountdown(seconds: number): void {
  broadcast(RealtimeMessage.Countdown, { seconds });
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
