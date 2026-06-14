import { EventPhase } from "./phases";

/**
 * Navi's interactive behavior — the playful layer on top of the phase-driven
 * Avatar Script Engine (see `avatar-scripts.ts`). This drives the things that
 * make Navi feel like a *live host* rather than a static mascot:
 *
 * - tap her → she reacts with a gesture + a one-liner (`NAVI_REACTIONS`)
 * - a rotating, phase-aware tips ticker (`NAVI_TIPS`) — proactive guidance,
 *   never a chat box (the host offers; the attendee never has to ask)
 * - she reacts live to the event: phase advances (`NAVI_ARRIVAL_LINES`) and the
 *   headcount jumping (`NAVI_PRESENCE_LINE`)
 *
 * Copy supports a `{name}` / `{count}` token — render with `template()` from
 * `@/utils/format`. Tone: warm + playful (friendly host, light humor).
 */

/**
 * A transient expression Navi plays on top of her resting mood — triggered by a
 * tap, a live event, or idle "alive" moments. Drives a short CSS gesture in
 * `AvatarHost`; never a raw string comparison (global repo rule).
 */
export enum NaviReaction {
  /** Springy squash-and-stretch — a tap. */
  Bounce = "bounce",
  /** Excited shimmy — a live event (phase advance / headcount jump). */
  Wiggle = "wiggle",
  /** A quick one-eyed wink — idle life. */
  Wink = "wink",
  /** A subtle look-around head tilt — idle life. */
  Glance = "glance",
}

/** Timings for Navi's interactions (no magic numbers in components). */
export const NAVI_CONFIG = {
  /** How long the tips ticker waits before auto-advancing. */
  tipRotateMs: 6500,
  /** How long a tap/live one-liner pop bubble stays up. */
  popVisibleMs: 3400,
  /** How long a reaction gesture (+ happy mood flash) lasts before resting. */
  reactionMs: 900,
  /** Idle "alive" gestures fire on a random interval in this window. */
  idleMinMs: 9000,
  idleMaxMs: 17000,
  /** Delay before the first-time "tap me" hint appears (hidden after a tap). */
  tapHintDelayMs: 3200,
  /** Min gap between headcount-jump reactions, so a rush doesn't spam her. */
  presenceCooldownMs: 9000,
  /** Approximate mouth-movement (talking) duration: per-character, clamped. */
  talkMsPerChar: 55,
  talkMinMs: 1100,
  talkMaxMs: 3200,
} as const;

/**
 * Phase-aware tips the ticker rotates through — Navi proactively guiding the
 * attendee through *this* moment of the day. Keep each one short + friendly.
 */
export const NAVI_TIPS: Record<EventPhase, string[]> = {
  [EventPhase.Registered]: [
    "Grab your badge at the welcome desk — Desk 3 has the shortest line right now. 🎟️",
    "Pro tip: screenshot today's plan so it's always one tap away. 📅",
    "The coffee bar on Level 2 is fully stocked and queue-free… for now. ☕",
    "Say hi to someone new near you — the best connections start before the keynote. 🤝",
    "Keep your phone handy, {name} — I'll nudge you the second your seat's ready. 🔔",
  ],
  [EventPhase.Seated]: [
    "Comfy seat? Drop your bag and take a breath — we begin shortly. 🪑",
    "Silence your phone (but keep me on!) — the keynote's about to start. 🤫",
    "Hydration check 💧 — there's water at the end of each row.",
    "Good seat karma: leave the aisle clear for anyone running late. 😇",
  ],
  [EventPhase.Opening]: [
    "Eyes up front — the opening keynote is the one not to miss. 🎤",
    "Jot down one idea you want to remember today. Future-you says thanks. ✍️",
    "Psst… the Virus Fight game is right after this. Limber up those thumbs. 🎮",
    "Applause is free — be generous with it. 👏",
  ],
  [EventPhase.GameSession]: [
    "Tap fast, tap everything — every mini-virus is points. 👾",
    "When the COVID boss appears, draw the shape I call out to blast it. ✏️",
    "Top 3 get a shoutout from the host — go climb that leaderboard! 🏆",
    "No thumbs of steel required, {name} — accuracy beats panic. 😎",
  ],
  [EventPhase.Buffet]: [
    "The smoothie bar is the hidden gem — thank me later. 🥤",
    "Beat the rush: the dessert table fills up fast around 12:15. 🍰",
    "Refuel and recharge — grab a window seat for the view. 🌿",
    "Compare game scores with your table — friendly bragging encouraged. 😄",
  ],
  [EventPhase.Closing]: [
    "Don't dash off — closing highlights and prizes are worth the stay. 🎉",
    "Connect with one new person before you head out. 📇",
    "Grab a goodie bag near the exit — limited stock! 🎁",
    "Safe travels, {name} — today was better because you came. 💙",
  ],
};

/**
 * One-liners Navi pops when the attendee taps her — a mix of helpful and pure
 * delight, so repeated taps stay fun. Drawn at random (never twice in a row).
 */
export const NAVI_REACTIONS: string[] = [
  "Hi {name}! 👋 Need a hand?",
  "Boop! ✨",
  "Psst — the coffee bar on Level 2 has zero queue right now. ☕",
  "I saved you a great seat. 😉",
  "You've got this, {name}. 💪",
  "Fun fact: I never blink first. 👀",
  "Tap me anytime — I'm your event navigator. 🧭",
  "Looking sharp today. 😎",
  "Stick with me and you won't miss a thing. 🌟",
  "Snack alert: the buffet opens at noon. 🍽️",
  "Want a tip? I've got a hundred of them. 💡",
  "High five! ✋",
  "I'm basically your event GPS. Recalculating… 🛰️",
  "Having fun yet, {name}? I sure am. 😄",
];

/**
 * Short, punchy lines Navi exclaims the moment the host advances the event to a
 * new phase — she announces the change live (paired with a happy wiggle).
 */
export const NAVI_ARRIVAL_LINES: Record<EventPhase, string> = {
  [EventPhase.Registered]: "You're checked in, {name}! Let the day begin. 🎉",
  [EventPhase.Seated]: "Seats are ready — follow me, {name}! 🎟️",
  [EventPhase.Opening]: "Here we go — the keynote's starting! 🎤",
  [EventPhase.GameSession]: "It's GAME TIME! Thumbs ready? 🎮",
  [EventPhase.Buffet]: "Buffet's open — go refuel, you earned it! 🍽️",
  [EventPhase.Closing]: "What a day, {name}! Let's wrap it up right. 🎉",
};

/** Navi's reaction when more attendees join — `{count}` is the live headcount. */
export const NAVI_PRESENCE_LINE = "Ooh, {count} of us in here now! 🎉";

/** Navi's room-wide cheer when the host announces the winner — `{winner}` is the name. */
export const NAVI_WINNER_CHEER =
  "And the champion is {winner}! 🏆 Incredible game, everyone — give yourselves a round of applause! 🎉";

/** Navi leading the synchronized pre-round countdown on every phone. */
export const NAVI_COUNTDOWN_LEAD = "Round starting — get ready, everyone!";
export const NAVI_COUNTDOWN_GO = "GO!";
/** What Navi says aloud per tick (TTS-friendly) while she leads the count. */
export const COUNTDOWN_WORDS: Record<number, string> = { 1: "One!", 2: "Two!", 3: "Three!" };
export const NAVI_COUNTDOWN_GO_WORD = "Go!";

/** First-time hint nudging the attendee to discover the tap interaction. */
export const NAVI_TAP_HINT = "tap me!";
