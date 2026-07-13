import { REGISTRATION_LIMITS } from "@/constants/registration";
import type { LearningGoals } from "@/types";

/**
 * Registration helpers shared by the welcome gate (client) and `/api/register`
 * (server): email + learning-goals validation and shaping. Isomorphic — no
 * browser or Node APIs.
 */

/** Pragmatic email shape check (capture-only — no verification round-trip). */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string): boolean {
  const email = value.trim();
  return email.length <= REGISTRATION_LIMITS.emailMax && EMAIL_PATTERN.test(email);
}

/** Canonical form stored server-side (dedupe key). */
export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Toggle a preset goal on/off, capping the selection at `maxGoals`. */
export function toggleGoal(selected: string[], goal: string): string[] {
  if (selected.includes(goal)) return selected.filter((item) => item !== goal);
  if (selected.length >= REGISTRATION_LIMITS.maxGoals) return selected;
  return [...selected, goal];
}

/** Shape the form state into the stored `LearningGoals` (trimmed + clamped). */
export function buildLearningGoals(selected: string[], custom: string): LearningGoals {
  return {
    selected: selected.slice(0, REGISTRATION_LIMITS.maxGoals),
    custom: custom.trim().slice(0, REGISTRATION_LIMITS.customGoalMax),
  };
}

/** At least one goal — a preset pick or a typed one. */
export function hasAnyGoal(goals: LearningGoals): boolean {
  return goals.selected.length > 0 || goals.custom.length > 0;
}

/**
 * Server-side guard: shape an untrusted payload into `LearningGoals`, or `null`
 * if it isn't one. Strings only, lengths clamped via `buildLearningGoals`.
 */
export function sanitizeLearningGoals(input: unknown): LearningGoals | null {
  if (typeof input !== "object" || input === null) return null;
  const { selected, custom } = input as { selected?: unknown; custom?: unknown };
  if (!Array.isArray(selected) || selected.some((item) => typeof item !== "string")) {
    return null;
  }
  if (typeof custom !== "string") return null;
  return buildLearningGoals(selected as string[], custom);
}
