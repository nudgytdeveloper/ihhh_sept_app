import { EVENT_NAME } from "./app";
import { EventPhase } from "./phases";
import { ROUTES } from "./routes";
import { AvatarMood, ActionIntent } from "./statuses";

/**
 * Avatar Script Engine (demo = rules-based).
 *
 * The host avatar is proactive and phase-driven: for each EventPhase it speaks
 * first and offers a clear next action. Later this can be extended to also key
 * off time, host actions, user status, and game status — full AI comes later.
 *
 * Copy supports a `{name}` token; render it with `template()` from /utils.
 */

export interface AvatarAction {
  label: string;
  href: string;
  intent: ActionIntent;
}

/**
 * The one label for "go to the full programme", used by the home journey CTA
 * and every schedule-bound avatar action, so the wording never drifts.
 */
export const SCHEDULE_CTA_LABEL = "See Event Schedule";

export interface AvatarScript {
  phase: EventPhase;
  /** Short eyebrow line above the speech bubble. */
  greeting: string;
  /** The main thing the avatar says. */
  message: string;
  mood: AvatarMood;
  /** Primary next-action the avatar nudges the attendee toward. */
  action?: AvatarAction;
  /** Optional secondary action. */
  secondaryAction?: AvatarAction;
}

export const AVATAR_SCRIPTS: Record<EventPhase, AvatarScript> = {
  [EventPhase.Registered]: {
    phase: EventPhase.Registered,
    greeting: `Welcome to ${EVENT_NAME} 👋`,
    message:
      "Great to have you here, {name}! You're all checked in. Take a look at today's plan and I'll guide you the rest of the way.",
    mood: AvatarMood.Welcoming,
    action: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Primary,
    },
  },
  [EventPhase.GameSession]: {
    phase: EventPhase.GameSession,
    greeting: "It's game time! 🎮",
    message:
      "The Virus Fight is on, {name}. Jump into the lobby and climb that leaderboard — the top 3 win prizes!",
    mood: AvatarMood.Excited,
    action: {
      label: "Enter the Game Lobby",
      href: ROUTES.GAME_LOBBY,
      intent: ActionIntent.Primary,
    },
    secondaryAction: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.StartOfEvent]: {
    phase: EventPhase.StartOfEvent,
    greeting: "Please take your seat",
    message:
      "We're starting, {name} — please be seated. Tap below and I'll show you exactly where to go.",
    mood: AvatarMood.Guiding,
    action: {
      label: "Find my seat",
      href: ROUTES.SEAT,
      intent: ActionIntent.Primary,
    },
    secondaryAction: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.Opening]: {
    phase: EventPhase.Opening,
    greeting: "We're about to begin",
    message:
      "Dr Peter Chow is giving the welcome speech now. Settle in, {name} — the award presentation is right after.",
    mood: AvatarMood.Guiding,
    action: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.AwardPresentation]: {
    phase: EventPhase.AwardPresentation,
    greeting: "Award presentation 🎓",
    message:
      "Certificates are being presented now. If your name is called, head up to the front — and let's hear that applause!",
    mood: AvatarMood.Celebrating,
    action: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.WinnersGroupPhoto]: {
    phase: EventPhase.WinnersGroupPhoto,
    greeting: "Winners & group photo 📸",
    message:
      "Time to crown our Virus Fight champions! Get seated for the group photo, {name} — everyone in frame.",
    mood: AvatarMood.Celebrating,
    action: {
      label: "See the leaderboard",
      href: ROUTES.GAME_LOBBY,
      intent: ActionIntent.Primary,
    },
  },
  [EventPhase.FoodCollection]: {
    phase: EventPhase.FoodCollection,
    greeting: "Lunch is ready 🍱",
    message:
      "Nicely played, {name}! Collect your lunch just outside the event hall — take your time and refuel.",
    mood: AvatarMood.Relaxed,
    action: {
      label: SCHEDULE_CTA_LABEL,
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.EndOfEvent]: {
    phase: EventPhase.EndOfEvent,
    greeting: "That's a wrap! 🎉",
    message: `What a day, {name}! Thank you for joining us at ${EVENT_NAME}. Your session recaps are ready before you go.`,
    mood: AvatarMood.Celebrating,
    action: {
      label: "Read my session recaps",
      href: ROUTES.RECAPS,
      intent: ActionIntent.Primary,
    },
  },
};

/**
 * Host's intro line for the schedule screen (Screen 2). Tokens: `{name}`,
 * `{phase}` — render with `template()` from `@/utils/format`.
 */
export const SCHEDULE_INTRO =
  "We're on {phase} right now, {name} — here's how the rest of your day unfolds.";

/**
 * Host's lines on the "find my seat" screen. Tokens: `{name}`, `{seat}`,
 * `{row}` — render with `template()` from `@/utils/format`.
 */
export const SEAT_INTRO =
  "You're in seat {seat}, {name} — Row {row}. I've marked it on the plan below.";

/** Shown when the attendee is on the list but hasn't been placed yet. */
export const SEAT_INTRO_UNASSIGNED =
  "You're checked in, {name} — we're still setting a seat aside for you. Approach the Reception and the team will point you to it.";

/**
 * Host's coaching line for the game lobby (Screen 3). Token: `{name}` — render
 * with `template()` from `@/utils/format`.
 */
export const LOBBY_INTRO =
  "You're in, {name}! Tap fast, beat the boss, and let's get you onto that leaderboard.";

/**
 * Host lines for the live round (Screen 4). Tokens vary per line:
 * `{name}`, `{shape}`, `{boss}` — render with `template()` from `@/utils/format`.
 */
export const GAME_SCRIPTS = {
  /** Shown over the pre-round countdown. */
  getReady: "Get ready, {name} — tap everything that moves!",
  /** Shown when the boss appears. */
  bossWarning: "Incoming! Draw a {shape} to blast the {boss}!",
  /** Shown when the boss is defeated. */
  bossDefeated: "Boom! The {boss} never stood a chance. 💥",
  /** Shown when the boss escapes (time ran out). */
  bossEscaped: "It slipped away — keep tapping, you've got this!",
  /** Shown on the end-of-round summary. */
  gameOver: "What a run, {name}! Here's how you stacked up.",
} as const;
