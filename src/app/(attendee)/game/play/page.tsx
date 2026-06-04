import { VirusFightGame } from "@/components/game/virus-fight-game";
import { GAME_NAME } from "@/constants/game";

export const metadata = { title: GAME_NAME };

/**
 * Screen 4 — Virus Fight. The interactive round lives in the VirusFightGame
 * client component; this page stays a server component so it can export metadata.
 */
export default function VirusFightPage() {
  return <VirusFightGame />;
}
