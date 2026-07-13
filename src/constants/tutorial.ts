/**
 * First-time onboarding tutorial — a Navi-led coach-mark tour.
 *
 * Each app (attendee + host) walks a new user through its key spots the first
 * time they open it, then stores a version-stamped "seen" flag in localStorage
 * so it never auto-runs again. Staying true to the product direction, Navi leads
 * the tour (she offers; the user never has to ask). See `src/utils/tutorial.ts`
 * for the store + geometry helpers and `src/components/tutorial/` for the UI.
 */

/** The two tours — keyed by app surface. */
export enum TutorialTour {
  Attendee = "attendee",
  Host = "host",
}

/**
 * Bump this when a tour's steps change so returning users see the refreshed
 * walkthrough once more (a stored flag below the current version is stale).
 */
export const TUTORIAL_VERSION = 1;

/** localStorage key = prefix + tour id (e.g. "ihhh:tutorial:attendee"). */
export const TUTORIAL_STORAGE_PREFIX = "ihhh:tutorial:";

/** DOM attribute a tour step anchors to (e.g. `data-tour="navi"`). */
export const TUTORIAL_ATTR = "data-tour";

/** Delay before a first-run tour auto-starts, letting the screen settle + paint. */
export const TUTORIAL_AUTOSTART_DELAY_MS = 700;

/** Callout width (px) — clamped to the viewport by the tour engine. */
export const TUTORIAL_CALLOUT_WIDTH = 320;

/** Padding (px) around the highlighted element inside the spotlight ring. */
export const TUTORIAL_SPOTLIGHT_PADDING = 8;

/** Where a step's callout sits relative to its target. */
export enum TutorialPlacement {
  Top = "top",
  Bottom = "bottom",
  Auto = "auto",
}

/**
 * Anchor ids a tour step points at — referenced from the UI via
 * `data-tour="<id>"`. Kept as an enum so steps + markup never share a raw string.
 */
export enum TourAnchor {
  // Attendee home (Screen 1)
  Navi = "navi",
  NextAction = "next-action",
  Journey = "journey",
  Game = "game",
  Recaps = "recaps",
  Notifications = "notifications",
  // Host control panel (Screen 5)
  HostJourney = "host-journey",
  HostFlow = "host-flow",
  HostBoss = "host-boss",
  HostReminders = "host-reminders",
  HostLeaderboard = "host-leaderboard",
}

export interface TutorialStep {
  anchor: TourAnchor;
  title: string;
  body: string;
  /** Preferred callout side; defaults to Auto (picks whichever side fits). */
  placement?: TutorialPlacement;
}

/** Attendee walkthrough — plain, casual, non-technical (matches Navi's voice). */
export const ATTENDEE_TOUR_STEPS: TutorialStep[] = [
  {
    anchor: TourAnchor.Navi,
    title: "Meet Navi",
    body: "This is Navi, your event guide. She greets you by name and always shows the one next thing to do — no menus to dig through.",
    placement: TutorialPlacement.Bottom,
  },
  {
    anchor: TourAnchor.NextAction,
    title: "Your next step",
    body: "Whatever's next — check in, take a seat, join the game — Navi puts it right here. Just tap the button.",
    placement: TutorialPlacement.Bottom,
  },
  {
    anchor: TourAnchor.Journey,
    title: "Where we are in the day",
    body: "Follow the whole day here: welcome, seating, the game, buffet, and the finish. It moves along as the event does.",
  },
  {
    anchor: TourAnchor.Game,
    title: "Play together",
    body: "A quick, fun group game with a live leaderboard. Jump in when Navi says it's game time.",
  },
  {
    anchor: TourAnchor.Recaps,
    title: "Take home a recap",
    body: "After the talks, get a short personal summary of each one — a tap away from sharing on WhatsApp.",
  },
  {
    anchor: TourAnchor.Notifications,
    title: "Get a heads-up",
    body: "Turn on phone alerts so you never miss game time, buffet, or the next talk — even with the app closed.",
    placement: TutorialPlacement.Top,
  },
];

/** Host walkthrough — running the room from one control screen. */
export const HOST_TOUR_STEPS: TutorialStep[] = [
  {
    anchor: TourAnchor.HostJourney,
    title: "Steer the day",
    body: "Move everyone from welcome, to seated, to buffet with a tap. Every guest's phone updates live.",
    placement: TutorialPlacement.Bottom,
  },
  {
    anchor: TourAnchor.HostFlow,
    title: "Run the game",
    body: "Start the round, launch a synced 3·2·1 countdown on every phone, or end the game — all from here.",
  },
  {
    anchor: TourAnchor.HostBoss,
    title: "Spring a surprise",
    body: "Unleash the COVID Boss and pick the shape guests must draw to beat it for bonus points.",
  },
  {
    anchor: TourAnchor.HostReminders,
    title: "Send a nudge",
    body: "Ping every guest's phone with a reminder in one tap — buffet's open, back to your seats, and more.",
  },
  {
    anchor: TourAnchor.HostLeaderboard,
    title: "Crown the winner",
    body: "Watch scores climb live, lock the board, then announce the winner — the whole room celebrates at once.",
    placement: TutorialPlacement.Top,
  },
];

/** Tour id → its steps. */
export const TOUR_STEPS: Record<TutorialTour, TutorialStep[]> = {
  [TutorialTour.Attendee]: ATTENDEE_TOUR_STEPS,
  [TutorialTour.Host]: HOST_TOUR_STEPS,
};

/** All tour copy (buttons + labels) in one place. */
export const TUTORIAL_COPY = {
  back: "Back",
  next: "Next",
  done: "Got it",
  skip: "Skip tour",
  restart: "Replay tour",
  ariaLabel: "App walkthrough",
  /** Step counter, e.g. "2 of 5". */
  step: (current: number, total: number) => `${current} of ${total}`,
} as const;
