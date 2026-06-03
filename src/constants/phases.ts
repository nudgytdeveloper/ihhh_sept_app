import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Armchair,
  Mic,
  Gamepad2,
  UtensilsCrossed,
  PartyPopper,
} from "lucide-react";

/**
 * The event journey. The Avatar Script Engine and the schedule timeline are
 * both driven by the current EventPhase.
 *
 * Registered → Seated → Opening → Game Session → Buffet → Closing
 */
export enum EventPhase {
  Registered = "registered",
  Seated = "seated",
  Opening = "opening",
  GameSession = "game_session",
  Buffet = "buffet",
  Closing = "closing",
}

/** Chronological order — drives the timeline + progress calculations. */
export const PHASE_ORDER: readonly EventPhase[] = [
  EventPhase.Registered,
  EventPhase.Seated,
  EventPhase.Opening,
  EventPhase.GameSession,
  EventPhase.Buffet,
  EventPhase.Closing,
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
  description: string;
  /** Display time for the demo schedule. */
  time: string;
  icon: LucideIcon;
  accent: PhaseAccent;
}

export const PHASE_META: Record<EventPhase, PhaseMeta> = {
  [EventPhase.Registered]: {
    id: EventPhase.Registered,
    label: "Registered",
    shortLabel: "Check-in",
    description: "Welcome aboard — complete your check-in to get started.",
    time: "8:30 AM",
    icon: BadgeCheck,
    accent: {
      text: "text-blue-600",
      soft: "bg-blue-500/10 text-blue-700",
      solid: "bg-blue-500 text-white",
      gradient: "from-blue-500 to-indigo-500",
    },
  },
  [EventPhase.Seated]: {
    id: EventPhase.Seated,
    label: "Seated",
    shortLabel: "Find seat",
    description: "Your seat is ready — head in and settle down.",
    time: "9:00 AM",
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
    description: "The opening keynote is about to begin.",
    time: "9:30 AM",
    icon: Mic,
    accent: {
      text: "text-violet-600",
      soft: "bg-violet-500/10 text-violet-700",
      solid: "bg-violet-500 text-white",
      gradient: "from-violet-500 to-purple-500",
    },
  },
  [EventPhase.GameSession]: {
    id: EventPhase.GameSession,
    label: "Game Session",
    shortLabel: "Game",
    description: "It's game time — join the Virus Fight and climb the leaderboard!",
    time: "10:45 AM",
    icon: Gamepad2,
    accent: {
      text: "text-teal-600",
      soft: "bg-teal-500/10 text-teal-700",
      solid: "bg-teal-500 text-white",
      gradient: "from-teal-400 to-cyan-500",
    },
  },
  [EventPhase.Buffet]: {
    id: EventPhase.Buffet,
    label: "Buffet",
    shortLabel: "Buffet",
    description: "Buffet is open — relax and refuel.",
    time: "12:00 PM",
    icon: UtensilsCrossed,
    accent: {
      text: "text-amber-600",
      soft: "bg-amber-500/10 text-amber-700",
      solid: "bg-amber-500 text-white",
      gradient: "from-amber-400 to-orange-500",
    },
  },
  [EventPhase.Closing]: {
    id: EventPhase.Closing,
    label: "Closing",
    shortLabel: "Closing",
    description: "That's a wrap — thanks for joining IHHH 2026!",
    time: "2:00 PM",
    icon: PartyPopper,
    accent: {
      text: "text-indigo-600",
      soft: "bg-indigo-500/10 text-indigo-700",
      solid: "bg-indigo-500 text-white",
      gradient: "from-indigo-500 to-violet-500",
    },
  },
};
