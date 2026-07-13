"use client";

import { useSyncExternalStore } from "react";
import {
  TUTORIAL_STORAGE_PREFIX,
  TUTORIAL_VERSION,
  TutorialPlacement,
  TutorialTour,
} from "@/constants/tutorial";

/**
 * Client store + geometry for the onboarding tour (mirrors the `navi-voice` /
 * `host-auth` module-store pattern). It owns:
 *  - the persisted "already seen this tour" flag (localStorage, version-aware),
 *  - the currently-active tour (so a replay button and the on-screen tour engine
 *    stay in sync via `useSyncExternalStore`), and
 *  - the pure callout-placement math the engine uses to position each step.
 */

/* ------------------------------- persistence ------------------------------- */

function storageKey(tour: TutorialTour): string {
  return `${TUTORIAL_STORAGE_PREFIX}${tour}`;
}

/** Has this device finished the tour at the current version? */
export function hasCompletedTour(tour: TutorialTour): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(storageKey(tour));
    return raw !== null && Number(raw) >= TUTORIAL_VERSION;
  } catch {
    return false;
  }
}

function persistCompletion(tour: TutorialTour, done: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (done) window.localStorage.setItem(storageKey(tour), String(TUTORIAL_VERSION));
    else window.localStorage.removeItem(storageKey(tour));
  } catch {
    /* storage unavailable — the tour simply may auto-run again next visit */
  }
}

/* ---------------------------------- store ---------------------------------- */

interface TutorialSnapshot {
  activeTour: TutorialTour | null;
}

let snapshot: TutorialSnapshot = { activeTour: null };
const SERVER_SNAPSHOT: TutorialSnapshot = { activeTour: null };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): TutorialSnapshot {
  return snapshot;
}
function getServerSnapshot(): TutorialSnapshot {
  return SERVER_SNAPSHOT;
}
function setActiveTour(tour: TutorialTour | null): void {
  if (snapshot.activeTour === tour) return;
  snapshot = { activeTour: tour };
  emit();
}

/* --------------------------------- actions --------------------------------- */

/** Begin (or replay) a tour — the on-screen engine picks it up. */
export function startTour(tour: TutorialTour): void {
  setActiveTour(tour);
}

/** Dismiss the running tour without stamping it complete. */
export function stopTour(): void {
  setActiveTour(null);
}

/** Stamp a tour finished (persisted) and close it if it's the active one. */
export function markTourComplete(tour: TutorialTour): void {
  persistCompletion(tour, true);
  if (snapshot.activeTour === tour) setActiveTour(null);
}

/** Forget a tour's completion flag (so it can be walked again). */
export function resetTour(tour: TutorialTour): void {
  persistCompletion(tour, false);
}

/* ---------------------------------- hook ----------------------------------- */

export interface Tutorial {
  activeTour: TutorialTour | null;
  start: (tour: TutorialTour) => void;
  stop: () => void;
  complete: (tour: TutorialTour) => void;
  reset: (tour: TutorialTour) => void;
}

/** React binding for the tour store. */
export function useTutorial(): Tutorial {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return {
    activeTour: snap.activeTour,
    start: startTour,
    stop: stopTour,
    complete: markTourComplete,
    reset: resetTour,
  };
}

/* -------------------------------- geometry --------------------------------- */

/** The subset of a DOMRect the callout math needs (viewport coordinates). */
export interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
  right: number;
}

export interface CalloutLayout {
  /** `fixed` top (px). For a Top placement the callout is shifted up by 100%. */
  top: number;
  /** `fixed` left (px). */
  left: number;
  placement: TutorialPlacement.Top | TutorialPlacement.Bottom;
  /** Horizontal offset (px) of the pointer within the callout. */
  arrowLeft: number;
}

const CALLOUT_GAP = 14; // space between target and callout
const VIEWPORT_MARGIN = 12; // keep the callout off the screen edges

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Place the step callout next to its target: below when there's room, above
 * otherwise (an explicit placement wins). The callout's measured height is used
 * both to pick a side and to clamp its top so it always stays fully on-screen —
 * even when the target is taller than the viewport — with the pointer aimed back
 * toward the target's center.
 */
export function computeCalloutLayout(
  rect: TargetRect,
  viewportWidth: number,
  viewportHeight: number,
  calloutWidth: number,
  calloutHeight: number,
  preferred: TutorialPlacement,
): CalloutLayout {
  const fitsBelow = rect.bottom + CALLOUT_GAP + calloutHeight <= viewportHeight - VIEWPORT_MARGIN;
  const fitsAbove = rect.top - CALLOUT_GAP - calloutHeight >= VIEWPORT_MARGIN;

  let placement: TutorialPlacement.Top | TutorialPlacement.Bottom;
  if (preferred === TutorialPlacement.Top) {
    placement = fitsAbove ? TutorialPlacement.Top : TutorialPlacement.Bottom;
  } else if (preferred === TutorialPlacement.Bottom) {
    placement = fitsBelow ? TutorialPlacement.Bottom : TutorialPlacement.Top;
  } else {
    placement = fitsBelow || !fitsAbove ? TutorialPlacement.Bottom : TutorialPlacement.Top;
  }

  const centerX = rect.left + rect.width / 2;
  const left = clamp(
    centerX - calloutWidth / 2,
    VIEWPORT_MARGIN,
    Math.max(VIEWPORT_MARGIN, viewportWidth - calloutWidth - VIEWPORT_MARGIN),
  );
  const arrowLeft = clamp(centerX - left, 20, calloutWidth - 20);

  const rawTop =
    placement === TutorialPlacement.Bottom
      ? rect.bottom + CALLOUT_GAP
      : rect.top - CALLOUT_GAP - calloutHeight;
  const top = clamp(
    rawTop,
    VIEWPORT_MARGIN,
    Math.max(VIEWPORT_MARGIN, viewportHeight - calloutHeight - VIEWPORT_MARGIN),
  );

  return { top, left, placement, arrowLeft };
}
