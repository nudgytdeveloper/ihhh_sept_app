"use client";

import { Reveal } from "@/components/navigator/reveal";
import { NavigatorHero } from "@/components/navigator/navigator-hero";
import { PhaseProgress } from "@/components/navigator/phase-progress";
import { GamePreviewCard } from "@/components/navigator/game-preview-card";
import { RecapsEntryCard } from "@/components/navigator/recaps-entry-card";
import { NotificationsCard } from "@/components/navigator/notifications-card";
import { StatusCard } from "@/components/navigator/status-card";
import { RemindersCard } from "@/components/navigator/reminders-card";
import { GuidedTour } from "@/components/tutorial/guided-tour";
import { TutorialReplayButton } from "@/components/tutorial/tutorial-replay-button";
import { ATTENDEE_TOUR_STEPS, TourAnchor, TutorialTour } from "@/constants/tutorial";
import {
  useEventPhase,
  useGameStatus,
  useLiveLeaderboard,
  usePlayerCount,
} from "@/components/navigator/attendee-shell";
import { getAvatarScript } from "@/utils/event";
import { toLeaderboard } from "@/utils/game";
import { attendeeFromIdentity, usePlayerIdentity } from "@/utils/player-identity";
import { MOCK_EVENT_STATE, MOCK_LEADERBOARD, MOCK_REMINDERS } from "@/data/event";

/** Idle teaser for the leaderboard peek before any live scores arrive (no "You"). */
const SAMPLE_LEADERBOARD = MOCK_LEADERBOARD.map((entry) => ({
  ...entry,
  isCurrentUser: false,
}));

/**
 * Screen 1 — Attendee Navigator Home. The avatar host leads with a single next
 * action; the event journey, status, and reminders follow. Both the persona
 * (name + seat, from the onboarded identity) and the current phase (host-driven,
 * live over the realtime channel) are real — the game preview stays a mock peek.
 */
export function NavigatorHome() {
  const phase = useEventPhase();
  const gameStatus = useGameStatus();
  const identity = usePlayerIdentity();
  const liveScores = useLiveLeaderboard();
  const playerCount = usePlayerCount();
  const attendee = attendeeFromIdentity(identity);
  const firstName = attendee.name.split(" ")[0];
  const script = getAvatarScript(phase);
  // The preview's live badge reflects the real host status, not the mock seed.
  const game = { ...MOCK_EVENT_STATE.game, status: gameStatus };

  // The peek shows the real shared board once scores arrive; until then a sample.
  const leaderboard =
    liveScores.length > 0 ? toLeaderboard(liveScores, identity.id) : SAMPLE_LEADERBOARD;

  // Live count of connected attendees; this device is always at least 1 (and over
  // the same-browser fallback, which can't aggregate, it's the only count we have).
  const onlineCount = Math.max(playerCount, 1);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-6">
      {/* First-time onboarding tour (auto-runs once; persisted in localStorage) */}
      <GuidedTour tour={TutorialTour.Attendee} steps={ATTENDEE_TOUR_STEPS} />

      <Reveal delay={0}>
        <NavigatorHero script={script} name={firstName} />
      </Reveal>

      <Reveal delay={90} anchor={TourAnchor.Journey}>
        <PhaseProgress phase={phase} />
      </Reveal>

      <Reveal delay={180} anchor={TourAnchor.Game}>
        <GamePreviewCard game={game} leaderboard={leaderboard} playerCount={onlineCount} />
      </Reveal>

      <Reveal delay={270} anchor={TourAnchor.Recaps}>
        <RecapsEntryCard />
      </Reveal>

      <Reveal delay={360} anchor={TourAnchor.Notifications}>
        <NotificationsCard />
      </Reveal>

      <Reveal delay={450}>
        <StatusCard attendee={attendee} />
      </Reveal>

      <Reveal delay={540}>
        <RemindersCard reminders={MOCK_REMINDERS} />
      </Reveal>

      <Reveal delay={630} className="flex justify-center pt-1">
        <TutorialReplayButton tour={TutorialTour.Attendee} />
      </Reveal>
    </div>
  );
}
