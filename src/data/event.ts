import { Gamepad2, Armchair, UtensilsCrossed } from "lucide-react";
import { EventPhase, PHASE_META } from "@/constants/phases";
import { GameStatus, GAME_CONFIG } from "@/constants/game";
import type { EventState, LeaderboardEntry, Reminder } from "@/types";

/**
 * Mock demo data. The real schedule is derived from `PHASE_META` — build it with
 * `buildSchedule()` from `@/utils/event` so the attendee's seat is resolved into
 * the copy. Only the solo-play leaderboard fallback and the proactive reminders
 * live here now.
 */

/** Sample Virus Fight leaderboard — solo-play rank fallback only. */
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, attendeeId: "att_044", name: "Priya N.", initials: "PN", score: 4820 },
  { rank: 2, attendeeId: "att_018", name: "Marcus L.", initials: "ML", score: 4510 },
  { rank: 3, attendeeId: "att_001", name: "Alex Tan", initials: "AT", score: 4380, isCurrentUser: true },
  { rank: 4, attendeeId: "att_032", name: "Sofia R.", initials: "SR", score: 3990 },
  { rank: 5, attendeeId: "att_009", name: "Daniel K.", initials: "DK", score: 3720 },
  { rank: 6, attendeeId: "att_027", name: "Hana W.", initials: "HW", score: 3510 },
  { rank: 7, attendeeId: "att_051", name: "Omar F.", initials: "OF", score: 3280 },
  { rank: 8, attendeeId: "att_013", name: "Lucia M.", initials: "LM", score: 3050 },
  { rank: 9, attendeeId: "att_006", name: "Ethan P.", initials: "EP", score: 2870 },
  { rank: 10, attendeeId: "att_039", name: "Grace Y.", initials: "GY", score: 2640 },
];

/**
 * Current event state for the demo. Defaults to the Game Session phase with the
 * lobby open, so the navigator home naturally surfaces the game entry point.
 */
export const MOCK_EVENT_STATE: EventState = {
  phase: EventPhase.GameSession,
  game: {
    status: GameStatus.Lobby,
    timeRemaining: GAME_CONFIG.roundSeconds,
    playerCount: 48,
  },
};

/**
 * Proactive reminders the avatar surfaces on the home screen — times mirror the
 * real programme lineup, so they stay in step with the schedule timeline.
 */
export const MOCK_REMINDERS: Reminder[] = [
  {
    id: "rem_game",
    title: "Virus Fight is starting",
    detail: "Join the lobby to grab your spot",
    time: PHASE_META[EventPhase.GameSession].time,
    icon: Gamepad2,
    accent: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "rem_seated",
    title: "Please be seated",
    detail: "Find your seat before the event starts",
    time: PHASE_META[EventPhase.StartOfEvent].time,
    icon: Armchair,
    accent: "bg-sky-500/10 text-sky-600",
  },
  {
    id: "rem_food",
    title: "Food collection",
    detail: "Collect your lunch outside the event hall",
    time: PHASE_META[EventPhase.FoodCollection].time,
    icon: UtensilsCrossed,
    accent: "bg-orange-500/10 text-orange-600",
  },
];
