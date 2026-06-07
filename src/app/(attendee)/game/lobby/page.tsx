import { LobbyScreen } from "@/components/game/lobby-screen";

export const metadata = { title: "Game Lobby" };

/**
 * Screen 3 — Game Lobby. Thin server component; the live orchestrator (with the
 * host-tracked headcount) is LobbyScreen.
 */
export default function GameLobbyPage() {
  return <LobbyScreen />;
}
