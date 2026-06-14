import type { LucideIcon } from "lucide-react";
import { Sparkles, UtensilsCrossed, DoorOpen, Bell } from "lucide-react";

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

export const HOST_REMINDERS: readonly HostReminder[] = [
  { id: "rem_game", label: "Game starting", detail: "Join the lobby now", icon: Sparkles },
  { id: "rem_buffet", label: "Buffet is open", detail: "Zone C · Level 3", icon: UtensilsCrossed },
  { id: "rem_hall", label: "Return to the hall", detail: "Afternoon session begins", icon: DoorOpen },
  { id: "rem_closing", label: "Closing keynote", detail: "Starts in 10 minutes", icon: Bell },
] as const;

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
