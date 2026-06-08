import { GameScreen } from "@/components/game/game-screen";
import { GAME_NAME } from "@/constants/game";

export const metadata = { title: GAME_NAME };

/**
 * Screen 4 — Virus Fight. GameScreen gates entry (only enterable during the live
 * Game Session) before mounting the interactive round; this page stays a server
 * component so it can export metadata.
 */
export default function VirusFightPage() {
  return <GameScreen />;
}
