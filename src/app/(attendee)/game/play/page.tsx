import { Gamepad2 } from "lucide-react";
import { ScreenStub } from "@/components/scaffold/screen-stub";
import { ROUTES } from "@/constants/routes";
import { GAME_NAME } from "@/constants/game";

export const metadata = { title: "Virus Fight" };

export default function VirusFightPage() {
  return (
    <ScreenStub
      icon={Gamepad2}
      eyebrow="Screen 4"
      title={GAME_NAME}
      description="Tap cute mini-viruses for points against a live countdown and leaderboard — then draw a shape to defeat the COVID boss for bonus points."
      gradient="from-teal-400 via-cyan-500 to-blue-500"
      currentHref={ROUTES.GAME_PLAY}
    />
  );
}
