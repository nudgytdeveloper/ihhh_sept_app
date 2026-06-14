/**
 * Reusable logic for Navi's interactive layer (selection + timing helpers).
 * Copy/config lives in `@/constants/navi`; the components that consume these
 * are `navi-host.tsx` (tap / live reactions / idle) and `navi-tips.tsx`.
 */

import { EventPhase } from "@/constants/phases";
import {
  NAVI_TIPS,
  NAVI_REACTIONS,
  NAVI_ARRIVAL_LINES,
  NAVI_PRESENCE_LINE,
  NAVI_CONFIG,
} from "@/constants/navi";
import { template } from "@/utils/format";

/** The rotating tips Navi offers for a given phase (falls back to check-in). */
export function getNaviTips(phase: EventPhase): string[] {
  const tips = NAVI_TIPS[phase];
  return tips.length > 0 ? tips : NAVI_TIPS[EventPhase.Registered];
}

/**
 * Pick a random index in `[0, length)` that isn't `prev`, so consecutive picks
 * never repeat (used for Navi's tap one-liners). O(1), no rejection loop.
 */
export function randomDifferentIndex(prev: number, length: number): number {
  if (length <= 1) return 0;
  const next = Math.floor(Math.random() * (length - 1));
  return next >= prev ? next + 1 : next;
}

/** A fresh tap one-liner for Navi, personalized and never the same as `prev`. */
export function nextNaviReaction(
  prev: number,
  name: string,
): { index: number; text: string } {
  const index = randomDifferentIndex(prev, NAVI_REACTIONS.length);
  return { index, text: template(NAVI_REACTIONS[index], { name }) };
}

/** Navi's "we just reached this phase" exclamation, personalized. */
export function getNaviArrivalLine(phase: EventPhase, name: string): string {
  return template(NAVI_ARRIVAL_LINES[phase], { name });
}

/** Navi's reaction to the live attendee headcount rising. */
export function formatNaviPresence(count: number): string {
  return template(NAVI_PRESENCE_LINE, { count: String(count) });
}

/**
 * Approximate how long Navi's mouth should "talk" for a line — proportional to
 * its length, clamped to a sensible window. Used to drive the speaking
 * animation without wiring into the audio element.
 */
export function estimateTalkMs(text: string): number {
  const raw = text.length * NAVI_CONFIG.talkMsPerChar;
  return Math.min(NAVI_CONFIG.talkMaxMs, Math.max(NAVI_CONFIG.talkMinMs, raw));
}
