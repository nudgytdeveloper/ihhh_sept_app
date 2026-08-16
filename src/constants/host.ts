import type { LucideIcon } from "lucide-react";
import { Sparkles, UtensilsCrossed, Armchair, Camera } from "lucide-react";
import { EventPhase, PHASE_META } from "./phases";

/**
 * Host Control Panel (Screen 5) constants. The panel drives GameStatus (see
 * `getHostControls` in `@/utils/game`); attendees react to it.
 */

/** A reminder the host can broadcast to every attendee with one tap. */
export interface HostReminder {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}

/** One-tap nudges, keyed to the real programme lineup so times never drift. */
export const HOST_REMINDERS: readonly HostReminder[] = [
  {
    id: "rem_game",
    label: "Game starting",
    detail: "Join the lobby now — top 3 win prizes",
    icon: Sparkles,
  },
  {
    id: "rem_seated",
    label: "Please be seated",
    detail: `Find your seat before ${PHASE_META[EventPhase.StartOfEvent].time}`,
    icon: Armchair,
  },
  {
    id: "rem_photo",
    label: "Group photo",
    detail: "Get seated — winners up front",
    icon: Camera,
  },
  {
    id: "rem_food",
    label: "Food collection",
    detail: "Collect your lunch outside the event hall",
    icon: UtensilsCrossed,
  },
] as const;

/**
 * Copy for the host's game-data controls. Scores accumulate across rounds, so
 * the two actions are deliberately different: a session reset banks the round
 * and opens a new one, while clearing wipes the event's scores for good.
 */
export const GAME_DATA_CONTROLS = {
  title: "Game data",
  description:
    "Scores add up across rounds. A session reset keeps them; clearing wipes them.",
  resetLabel: "Reset game session",
  resetDetail: "Open a fresh round — scores are kept",
  clearLabel: "Clear all game data",
  clearDetail: "Erase every score — cannot be undone",
  confirmTitle: "Clear all game data?",
  confirmBody:
    "This permanently erases every attendee's score for the event, on the live leaderboard and in the database. Attendees will drop to zero and the roster will show no scores. This cannot be undone.",
  confirmCancel: "Keep the scores",
  confirmAction: "Yes, clear everything",
} as const;

/** Severity/tone of an entry in the host activity log. */
export enum LogTone {
  Info = "info",
  Success = "success",
  Warn = "warn",
  Danger = "danger",
}

/** Dot color (Tailwind literal) for each activity-log tone. */
export const LOG_TONE_DOT: Record<LogTone, string> = {
  [LogTone.Info]: "bg-blue-500",
  [LogTone.Success]: "bg-emerald-500",
  [LogTone.Warn]: "bg-amber-500",
  [LogTone.Danger]: "bg-rose-500",
};

/** Winner-announcement celebration (confetti burst — host's big screen + every attendee phone). */
export const CELEBRATION = {
  /** How long the confetti overlay stays mounted after an announce. */
  confettiMs: 4200,
  /** Number of confetti pieces in a burst. */
  confettiPieces: 90,
} as const;
