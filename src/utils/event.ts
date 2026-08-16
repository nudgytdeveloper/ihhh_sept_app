import {
  EventPhase,
  PHASE_ORDER,
  PHASE_META,
  PhaseProgressState,
  type PhaseMeta,
} from "@/constants/phases";
import { AVATAR_SCRIPTS, type AvatarScript } from "@/constants/avatar-scripts";
import { EVENT_TIMEZONE_OFFSET_MINUTES } from "@/constants/app";
import { SEAT_DISPLAY } from "@/constants/seating";
import { template } from "@/utils/format";
import type { ScheduleItem } from "@/types";

/** Display metadata for a phase. */
export function getPhaseMeta(phase: EventPhase): PhaseMeta {
  return PHASE_META[phase];
}

/** Index of a phase in the event journey (0-based). */
export function getPhaseIndex(phase: EventPhase): number {
  return PHASE_ORDER.indexOf(phase);
}

/** The next phase in the journey, or null if this is the last. */
export function getNextPhase(phase: EventPhase): EventPhase | null {
  const next = getPhaseIndex(phase) + 1;
  return next < PHASE_ORDER.length ? PHASE_ORDER[next] : null;
}

/** Whether `phase` comes strictly before `current` (i.e. already done). */
export function isPhaseComplete(current: EventPhase, phase: EventPhase): boolean {
  return getPhaseIndex(phase) < getPhaseIndex(current);
}

/** Progress through the event as a 0–1 fraction (for progress bars). */
export function getPhaseProgress(phase: EventPhase): number {
  const lastIndex = PHASE_ORDER.length - 1;
  if (lastIndex <= 0) return 1;
  return getPhaseIndex(phase) / lastIndex;
}

/**
 * Progress state of `phase` relative to the `current` phase
 * (Done → Current → Next → Upcoming). Drives the schedule timeline.
 */
export function getPhaseState(
  current: EventPhase,
  phase: EventPhase,
): PhaseProgressState {
  const currentIndex = getPhaseIndex(current);
  const phaseIndex = getPhaseIndex(phase);
  if (phaseIndex < currentIndex) return PhaseProgressState.Done;
  if (phaseIndex === currentIndex) return PhaseProgressState.Current;
  if (phaseIndex === currentIndex + 1) return PhaseProgressState.Next;
  return PhaseProgressState.Upcoming;
}

/** The avatar's scripted line for the given phase. */
export function getAvatarScript(phase: EventPhase): AvatarScript {
  return AVATAR_SCRIPTS[phase];
}

/**
 * The full programme lineup with the attendee's seat resolved into the copy.
 * Pass the seat id (e.g. "H3"); omit it and the unassigned wording is used so
 * a walk-in is pointed at Reception instead of reading "seat number is NA".
 */
export function buildSchedule(seatId?: string | null): ScheduleItem[] {
  const seat = seatId?.trim() ?? "";
  return PHASE_ORDER.map((phase) => {
    const meta = PHASE_META[phase];
    const copy =
      seat === "" && meta.descriptionUnassigned
        ? meta.descriptionUnassigned
        : meta.description;
    return {
      phase,
      title: meta.label,
      time: meta.time,
      description: template(copy, { seat: seat || SEAT_DISPLAY.unassignedLabel }),
      details: meta.details,
    };
  });
}

/** Minutes since midnight in Singapore time (UTC+8) for a given instant. */
export function getSingaporeMinutes(now: Date = new Date()): number {
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  return (utcMinutes + EVENT_TIMEZONE_OFFSET_MINUTES) % (24 * 60);
}

/**
 * The phase the programme clock says we should be in — the last phase whose
 * scheduled start has passed in Singapore time. Before the first phase starts,
 * the journey sits at phase 1. This is what drives automatic advancement; the
 * host can always override it from the control room.
 */
export function getScheduledPhase(now: Date = new Date()): EventPhase {
  const minutes = getSingaporeMinutes(now);
  let current = PHASE_ORDER[0];
  for (const phase of PHASE_ORDER) {
    if (PHASE_META[phase].startMinutes <= minutes) current = phase;
  }
  return current;
}

/**
 * The next phase the programme clock will move to, or null once the last one has
 * started. Drives the host's "auto-advances to X at 12:05 PM" line, so the copy
 * always comes from the same schedule the clock reads.
 */
export function getNextScheduledPhase(now: Date = new Date()): PhaseMeta | null {
  const minutes = getSingaporeMinutes(now);
  const next = PHASE_ORDER.find((phase) => PHASE_META[phase].startMinutes > minutes);
  return next ? PHASE_META[next] : null;
}
