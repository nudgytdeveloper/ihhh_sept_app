import type { LucideIcon } from "lucide-react";
import type { EventPhase } from "@/constants/phases";
import type { RegistrationStatus, SeatStatus } from "@/constants/statuses";
import type { GameStatus, BossShape } from "@/constants/game";

/** Where an attendee is sitting. */
export interface SeatInfo {
  status: SeatStatus;
  zone?: string;
  table?: string;
  seat?: string;
}

/**
 * Learning goals an attendee sets at registration: preset picks + an optional
 * free-text goal. Feeds the personalized AI session summaries.
 */
export interface LearningGoals {
  selected: string[];
  custom: string;
}

/**
 * A registered attendee as stored server-side (keyed by corporate email) and
 * returned by `/api/register`. Distinct from `Attendee` (the local UI persona).
 */
export interface RegisteredAttendee {
  id: string;
  name: string;
  email: string;
  seat: SeatInfo | null;
  goals: LearningGoals;
}

/**
 * One line of the host roster: a registered attendee with their attendance
 * mark and persisted best game score (as served by `/api/roster`).
 */
export interface RosterEntry {
  id: string;
  name: string;
  email: string;
  seat: SeatInfo | null;
  goals: LearningGoals;
  /** ISO timestamps (JSON-serialized). */
  registeredAt: string;
  checkedInAt: string | null;
  /** Best virus-game score across the event (null = hasn't played yet). */
  score: number | null;
  /** Connected to the live event stream right now. */
  online: boolean;
}

/** `/api/roster` payload. `available` is false when no database is configured. */
export interface RosterResponse {
  available: boolean;
  roster: RosterEntry[];
}

/** A single event attendee (the current user, in the demo). */
export interface Attendee {
  id: string;
  name: string;
  initials: string;
  company?: string;
  avatarUrl?: string;
  registration: RegistrationStatus;
  seat: SeatInfo;
}

/** One row in the schedule / phase timeline. */
export interface ScheduleItem {
  phase: EventPhase;
  title: string;
  time: string;
  description: string;
}

/** One row on the Virus Fight leaderboard. */
export interface LeaderboardEntry {
  rank: number;
  attendeeId: string;
  name: string;
  initials: string;
  score: number;
  isCurrentUser?: boolean;
}

/**
 * A single player's live score, reported attendee → server over the realtime
 * channel. The server aggregates these into the shared leaderboard it fans back
 * out (see `@/server/game-hub`). Keyed by `playerId` (one per device).
 */
export interface ScoreEntry {
  playerId: string;
  name: string;
  score: number;
}

/** Live game session state (host-controlled). */
export interface GameSession {
  status: GameStatus;
  /** Seconds remaining in the current round, when active. */
  timeRemaining: number;
  /** Number of players currently in the lobby/round. */
  playerCount: number;
  /** Shape required to defeat the boss, when a boss is active. */
  requiredShape?: BossShape;
}

/**
 * The overall event state the Avatar Script Engine reads from.
 * In the demo this is mocked; later it can come from realtime backend.
 */
export interface EventState {
  phase: EventPhase;
  game: GameSession;
}

/**
 * The live session snapshot the host broadcasts to attendees over the realtime
 * channel (see `@/utils/realtime`). Distinct from `GameSession` (the mock seed):
 * this is what actually flows host → attendee at runtime to drive the game.
 */
export interface GameSessionState {
  status: GameStatus;
  /** Shape to draw while a boss is active, else null. */
  requiredShape: BossShape | null;
  /** Mini-virus waves the host has released this round. */
  waves: number;
  /** Whether the host has locked the leaderboard. */
  locked: boolean;
  /** Name of the announced winner, once the host announces one. */
  winnerName: string | null;
}

/** A proactive nudge the avatar surfaces on the navigator home. */
export interface Reminder {
  id: string;
  title: string;
  detail: string;
  time?: string;
  icon: LucideIcon;
  /** Soft accent class bundle for the icon tile (Tailwind literal). */
  accent: string;
}
