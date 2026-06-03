import { Reveal } from "@/components/navigator/reveal";
import { NavigatorHero } from "@/components/navigator/navigator-hero";
import { PhaseProgress } from "@/components/navigator/phase-progress";
import { GamePreviewCard } from "@/components/navigator/game-preview-card";
import { StatusCard } from "@/components/navigator/status-card";
import { RemindersCard } from "@/components/navigator/reminders-card";
import { getAvatarScript } from "@/utils/event";
import {
  MOCK_ATTENDEE,
  MOCK_EVENT_STATE,
  MOCK_LEADERBOARD,
  MOCK_REMINDERS,
} from "@/data/event";

export default function NavigatorHomePage() {
  const attendee = MOCK_ATTENDEE;
  const { phase, game } = MOCK_EVENT_STATE;
  const firstName = attendee.name.split(" ")[0];
  const script = getAvatarScript(phase);

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pb-12 pt-6">
      <Reveal delay={0}>
        <NavigatorHero script={script} name={firstName} />
      </Reveal>

      <Reveal delay={90}>
        <PhaseProgress phase={phase} />
      </Reveal>

      <Reveal delay={180}>
        <GamePreviewCard game={game} leaderboard={MOCK_LEADERBOARD} />
      </Reveal>

      <Reveal delay={270}>
        <StatusCard attendee={attendee} />
      </Reveal>

      <Reveal delay={360}>
        <RemindersCard reminders={MOCK_REMINDERS} />
      </Reveal>
    </div>
  );
}
