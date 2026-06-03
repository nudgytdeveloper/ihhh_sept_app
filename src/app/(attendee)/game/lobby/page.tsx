import { Users } from "lucide-react";
import { ScreenStub } from "@/components/scaffold/screen-stub";
import { ROUTES } from "@/constants/routes";
import { GAME_NAME } from "@/constants/game";

export const metadata = { title: "Game Lobby" };

export default function GameLobbyPage() {
  return (
    <ScreenStub
      icon={Users}
      eyebrow="Screen 3"
      title={`${GAME_NAME} Lobby`}
      description="Players gather here before the round — see who's in, get ready, and wait for the host to start the game."
      gradient="from-teal-400 to-cyan-500"
      currentHref={ROUTES.GAME_LOBBY}
    />
  );
}
