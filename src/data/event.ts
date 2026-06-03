import { Gamepad2, UtensilsCrossed, Camera } from "lucide-react";
import { EventPhase, PHASE_ORDER, PHASE_META } from "@/constants/phases";
import { RegistrationStatus, SeatStatus } from "@/constants/statuses";
import { GameStatus, GAME_CONFIG } from "@/constants/game";
import type {
  Attendee,
  EventState,
  LeaderboardEntry,
  Reminder,
  ScheduleItem,
} from "@/types";

/**
 * Mock demo data. Visual polish matters more than backend completeness for the
 * demo, so screens read from here. Swap for a realtime backend later.
 */

export const MOCK_ATTENDEE: Attendee = {
  id: "att_001",
  name: "Alex Tan",
  initials: "AT",
  company: "Northstar Health",
  registration: RegistrationStatus.Complete,
  seat: {
    status: SeatStatus.Ready,
    zone: "Zone B",
    table: "Table 7",
    seat: "Seat 3",
  },
};

/** Full-day schedule, derived from the phase metadata. */
export const MOCK_SCHEDULE: ScheduleItem[] = PHASE_ORDER.map((phase) => {
  const meta = PHASE_META[phase];
  return {
    phase,
    title: meta.label,
    time: meta.time,
    description: meta.description,
  };
});

/** Sample Virus Fight leaderboard (current user highlighted). */
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

/** Proactive reminders the avatar surfaces on the home screen. */
export const MOCK_REMINDERS: Reminder[] = [
  {
    id: "rem_game",
    title: "Virus Fight is starting",
    detail: "Join the lobby to grab your spot",
    time: "10:45 AM",
    icon: Gamepad2,
    accent: "bg-teal-500/10 text-teal-600",
  },
  {
    id: "rem_buffet",
    title: "Buffet opens at noon",
    detail: "Zone C · Level 3",
    time: "12:00 PM",
    icon: UtensilsCrossed,
    accent: "bg-amber-500/10 text-amber-600",
  },
  {
    id: "rem_photo",
    title: "Photo booth open all day",
    detail: "Near the main entrance",
    icon: Camera,
    accent: "bg-violet-500/10 text-violet-600",
  },
];
