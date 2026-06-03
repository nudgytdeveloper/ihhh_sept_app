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
