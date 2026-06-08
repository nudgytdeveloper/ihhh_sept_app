"use client";

import { useEffect, useState } from "react";
import { VirusFightGame } from "@/components/game/virus-fight-game";
import { GameLocked } from "@/components/game/game-locked";
import { useEventPhase, useGameStatus } from "@/components/navigator/attendee-shell";
import { canEnterGame } from "@/utils/game";

/**
 * Entry gate for Screen 4. The live round is only enterable during the Game
 * Session phase while the host has a live round running (see `canEnterGame`) —
 * so attendees can't drop into a round the host hasn't started, or re-enter one
 * that has ended.
 *
 * Entry is latched: once a live round lets the attendee in, the game stays
 * mounted even if the host then ends/locks it, so they see the in-game round
 * summary instead of being yanked to the locked screen. Navigating away and back
 * re-checks the gate from scratch.
 */
export function GameScreen() {
  const phase = useEventPhase();
  const status = useGameStatus();
  const canEnter = canEnterGame(phase, status);

  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (canEnter) setEntered(true);
  }, [canEnter]);

  if (!canEnter && !entered) {
    return <GameLocked phase={phase} status={status} />;
  }

  return <VirusFightGame />;
}
