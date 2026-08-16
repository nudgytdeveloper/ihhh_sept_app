import type { LucideIcon } from "lucide-react";
import { EVENT_NAME } from "./app";
import {
  BadgeCheck,
  Armchair,
  Mic,
  Gamepad2,
  Award,
  Camera,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";

/**
 * The event journey — the real IHH SG Learning Festival 2026 programme lineup.
 * The Avatar Script Engine, the schedule timeline and the host's phase tabs are
 * all driven by the current EventPhase.
 *
 * Registered → Game Session → Start of Event → Opening → Award Presentation
 *   → Winners / Group Photo → Food Collection → End of Event
 *
 * Registration and the game share the 11:30 slot ("Registration & Game Session"
 * on the programme), so the clock-driven resolver lands on Game Session from
 * 11:30 and Registered reads as done — matching the client's revised mock.
 */
export enum EventPhase {
  Registered = "registered",
  GameSession = "game_session",
  StartOfEvent = "start_of_event",
  Opening = "opening",
  AwardPresentation = "award_presentation",
  WinnersGroupPhoto = "winners_group_photo",
  FoodCollection = "food_collection",
  EndOfEvent = "end_of_event",
}

/** Chronological order — drives the timeline + progress calculations. */
export const PHASE_ORDER: readonly EventPhase[] = [
  EventPhase.Registered,
  EventPhase.GameSession,
  EventPhase.StartOfEvent,
  EventPhase.Opening,
  EventPhase.AwardPresentation,
  EventPhase.WinnersGroupPhoto,
  EventPhase.FoodCollection,
  EventPhase.EndOfEvent,
] as const;

/** Static Tailwind class bundle for a phase accent (kept literal so Tailwind detects them). */
export interface PhaseAccent {
  /** Foreground text color, e.g. headings/icons. */
  text: string;
  /** Soft tinted background + readable text (chips, icon tiles). */
  soft: string;
  /** Solid fill for emphasis (active step dot, badges). */
  solid: string;
  /** Gradient stops for hero/avatar accents (pair with `bg-gradient-to-br`). */
  gradient: string;
}

export interface PhaseMeta {
  id: EventPhase;
  label: string;
  shortLabel: string;
  /**
   * Schedule copy. Supports a `{seat}` token — resolve it with `buildSchedule()`
   * from `@/utils/event` rather than interpolating ad-hoc.
   */
  description: string;
  /** Copy used instead of `description` when the attendee has no seat yet. */
  descriptionUnassigned?: string;
  /** Extra bullet lines under the description (e.g. the award certificates). */
  details?: readonly string[];
  /** Display time for the schedule. */
  time: string;
  /**
   * Scheduled start as minutes since midnight, Singapore time (UTC+8). The
   * single source of truth for clock-driven phase advancement — never parse
   * `time` back into a number.
   */
  startMinutes: number;
  icon: LucideIcon;
  accent: PhaseAccent;
}

/** Minutes-since-midnight helper, so the times below stay readable. */
const at = (hour24: number, minute: number) => hour24 * 60 + minute;

export const PHASE_META: Record<EventPhase, PhaseMeta> = {
  [EventPhase.Registered]: {
    id: EventPhase.Registered,
    label: "Registered",
    shortLabel: "Check-in",
    description: `Welcome to ${EVENT_NAME}! Your seat number is {seat}.`,
    descriptionUnassigned: `Welcome to ${EVENT_NAME}! Approach the Reception and we'll get you seated.`,
    time: "11:30 AM",
    startMinutes: at(11, 30),
    icon: BadgeCheck,
    accent: {
      text: "text-blue-600",
      soft: "bg-blue-500/10 text-blue-700",
      solid: "bg-blue-500 text-white",
      gradient: "from-blue-500 to-indigo-500",
    },
  },
  [EventPhase.GameSession]: {
    id: EventPhase.GameSession,
    label: "Game Session",
    shortLabel: "Game",
    description:
      "Join the Fight and climb the Leaderboard! Top 3 winners receive prizes!",
    time: "11:30 AM",
    startMinutes: at(11, 30),
    icon: Gamepad2,
    accent: {
      text: "text-teal-600",
      soft: "bg-teal-500/10 text-teal-700",
      solid: "bg-teal-500 text-white",
      gradient: "from-teal-400 to-cyan-500",
    },
  },
  [EventPhase.StartOfEvent]: {
    id: EventPhase.StartOfEvent,
    label: "Start of Event",
    shortLabel: "Be seated",
    description: "Please be seated. Your seat number is {seat}.",
    descriptionUnassigned:
      "Please be seated. Approach the Reception if you need help finding your seat.",
    time: "11:55 AM",
    startMinutes: at(11, 55),
    icon: Armchair,
    accent: {
      text: "text-sky-600",
      soft: "bg-sky-500/10 text-sky-700",
      solid: "bg-sky-500 text-white",
      gradient: "from-sky-400 to-blue-500",
    },
  },
  [EventPhase.Opening]: {
    id: EventPhase.Opening,
    label: "Opening",
    shortLabel: "Opening",
    description: "Welcome Speech by Dr Peter Chow.",
    time: "12:05 PM",
    startMinutes: at(12, 5),
    icon: Mic,
    accent: {
      text: "text-violet-600",
      soft: "bg-violet-500/10 text-violet-700",
      solid: "bg-violet-500 text-white",
      gradient: "from-violet-500 to-purple-500",
    },
  },
  [EventPhase.AwardPresentation]: {
    id: EventPhase.AwardPresentation,
    label: "Award Presentation",
    shortLabel: "Awards",
    description: "Presentation of awards for:",
    details: [
      "Certificate in Designing Training for Healthcare Professional",
      "Certificate in Workplace Learning & Coaching",
      "Leadership Development Programme",
    ],
    time: "12:10 PM",
    startMinutes: at(12, 10),
    icon: Award,
    accent: {
      text: "text-amber-600",
      soft: "bg-amber-500/10 text-amber-700",
      solid: "bg-amber-500 text-white",
      gradient: "from-amber-400 to-orange-500",
    },
  },
  [EventPhase.WinnersGroupPhoto]: {
    id: EventPhase.WinnersGroupPhoto,
    label: "Winners / Group Photo",
    shortLabel: "Photo",
    description:
      "Winners of Game Leaderboard! Get seated for a group photography.",
    time: "12:45 PM",
    startMinutes: at(12, 45),
    icon: Camera,
    accent: {
      text: "text-rose-600",
      soft: "bg-rose-500/10 text-rose-700",
      solid: "bg-rose-500 text-white",
      gradient: "from-rose-400 to-pink-500",
    },
  },
  [EventPhase.FoodCollection]: {
    id: EventPhase.FoodCollection,
    label: "Food Collection",
    shortLabel: "Food",
    description: "Collect your lunch outside the event hall.",
    time: "12:50 PM",
    startMinutes: at(12, 50),
    icon: UtensilsCrossed,
    accent: {
      text: "text-orange-600",
      soft: "bg-orange-500/10 text-orange-700",
      solid: "bg-orange-500 text-white",
      gradient: "from-orange-400 to-amber-500",
    },
  },
  [EventPhase.EndOfEvent]: {
    id: EventPhase.EndOfEvent,
    label: "End of Event",
    shortLabel: "End",
    description: `Thank you for joining us at ${EVENT_NAME}!`,
    time: "1:00 PM",
    startMinutes: at(13, 0),
    icon: PartyPopper,
    accent: {
      text: "text-indigo-600",
      soft: "bg-indigo-500/10 text-indigo-700",
      solid: "bg-indigo-500 text-white",
      gradient: "from-indigo-500 to-violet-500",
    },
  },
};

/**
 * Progress state of a phase relative to the current one — drives the schedule
 * timeline's node/card styling and status label. Derive it with
 * `getPhaseState()` from `@/utils/event` rather than comparing indices ad-hoc.
 */
export enum PhaseProgressState {
  Done = "done",
  Current = "current",
  Next = "next",
  Upcoming = "upcoming",
}

export interface PhaseStateMeta {
  /** Status badge label shown on a timeline row. */
  label: string;
  /** Soft badge classes (kept literal so Tailwind detects them). */
  chip: string;
}

export const PHASE_STATE_META: Record<PhaseProgressState, PhaseStateMeta> = {
  [PhaseProgressState.Done]: {
    label: "Done",
    chip: "bg-muted text-muted-foreground",
  },
  [PhaseProgressState.Current]: {
    label: "Happening now",
    chip: "bg-teal-500/15 text-teal-700",
  },
  [PhaseProgressState.Next]: {
    label: "Up next",
    chip: "bg-blue-500/10 text-blue-700",
  },
  [PhaseProgressState.Upcoming]: {
    label: "Upcoming",
    chip: "bg-muted/70 text-muted-foreground",
  },
};
