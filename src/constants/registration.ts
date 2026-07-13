import type { LearningGoals } from "@/types";

/**
 * Registration (Nov-event MVP): the welcome gate collects the attendee's name,
 * corporate email, and learning goals. Email is capture-only (no verification)
 * and becomes the canonical identity — see `/api/register`. Learning goals feed
 * the AI session summaries later in the flow.
 */

/** Steps of the welcome gate. */
export enum RegistrationStep {
  Details = "details",
  Goals = "goals",
}

/** API path the welcome gate posts the registration to. */
export const REGISTER_API_PATH = "/api/register";

/** Preset learning goals the attendee can pick from (plus a free-text goal). */
export const LEARNING_GOAL_PRESETS: readonly string[] = [
  "Preventive health & longevity",
  "Workplace wellness ideas",
  "Digital health innovations",
  "Mental wellbeing practices",
  "Healthcare leadership insights",
  "Networking with peers",
] as const;

/** Input limits for the registration form (client + server validation). */
export const REGISTRATION_LIMITS = {
  nameMax: 24,
  emailMax: 254,
  customGoalMax: 120,
  /** Most preset goals an attendee can select. */
  maxGoals: 3,
} as const;

/** Empty goals value (pre-registration / SSR placeholder). */
export const EMPTY_LEARNING_GOALS: LearningGoals = { selected: [], custom: "" };
