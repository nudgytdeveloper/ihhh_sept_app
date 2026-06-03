import { EventPhase, PHASE_ORDER, PHASE_META, type PhaseMeta } from "@/constants/phases";
import { AVATAR_SCRIPTS, type AvatarScript } from "@/constants/avatar-scripts";

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

/** The avatar's scripted line for the given phase. */
export function getAvatarScript(phase: EventPhase): AvatarScript {
  return AVATAR_SCRIPTS[phase];
}
