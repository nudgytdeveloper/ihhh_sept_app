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
    greeting: "Welcome to IHHH 2026 👋",
    message:
      "Great to have you here, {name}! You're all checked in. Take a look at today's plan and I'll guide you the rest of the way.",
    mood: AvatarMood.Welcoming,
    action: {
      label: "See today's plan",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Primary,
    },
  },
  [EventPhase.Seated]: {
    phase: EventPhase.Seated,
    greeting: "Your seat is ready",
    message:
      "Head on in, {name} — your seat is waiting. Get comfortable, we're starting shortly.",
    mood: AvatarMood.Guiding,
    action: {
      label: "View the schedule",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Primary,
    },
  },
  [EventPhase.Opening]: {
    phase: EventPhase.Opening,
    greeting: "We're about to begin",
    message:
      "The opening keynote is starting now. Settle in — and stay close, the Virus Fight game is coming up next!",
    mood: AvatarMood.Guiding,
    action: {
      label: "Open the schedule",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.GameSession]: {
    phase: EventPhase.GameSession,
    greeting: "It's game time! 🎮",
    message:
      "The Virus Fight is about to begin, {name}. Jump into the lobby, grab your spot, and let's climb that leaderboard together!",
    mood: AvatarMood.Excited,
    action: {
      label: "Enter the Game Lobby",
      href: ROUTES.GAME_LOBBY,
      intent: ActionIntent.Primary,
    },
    secondaryAction: {
      label: "Check the schedule",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.Buffet]: {
    phase: EventPhase.Buffet,
    greeting: "Buffet is open 🍽️",
    message:
      "Nicely played, {name}! Time to relax and refuel — the buffet is open. I'll let you know when we head back to the hall.",
    mood: AvatarMood.Relaxed,
    action: {
      label: "See afternoon schedule",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Secondary,
    },
  },
  [EventPhase.Closing]: {
    phase: EventPhase.Closing,
    greeting: "That's a wrap! 🎉",
    message:
      "What a day, {name}! Thanks for being part of IHHH 2026. Catch the closing highlights before you go.",
    mood: AvatarMood.Celebrating,
    action: {
      label: "View closing details",
      href: ROUTES.SCHEDULE,
      intent: ActionIntent.Primary,
    },
  },
};
