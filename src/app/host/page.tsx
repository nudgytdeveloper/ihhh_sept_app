import { SlidersHorizontal } from "lucide-react";
import { ScreenStub } from "@/components/scaffold/screen-stub";
import { ROUTES } from "@/constants/routes";

export const metadata = { title: "Host Control Panel" };

export default function HostPanelPage() {
  return (
    <ScreenStub
      icon={SlidersHorizontal}
      eyebrow="Screen 5"
      title="Host Game Control Panel"
      description="Run the show: start/end the game, spawn virus waves, summon the COVID boss with a required shape, lock the leaderboard, announce the winner, and push reminders."
      gradient="from-violet-500 to-indigo-500"
      currentHref={ROUTES.HOST}
    />
  );
}
