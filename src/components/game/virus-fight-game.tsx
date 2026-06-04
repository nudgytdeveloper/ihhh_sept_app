"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GameHud } from "@/components/game/game-hud";
import { GameIntro } from "@/components/game/game-intro";
import { BossFight } from "@/components/game/boss-fight";
import { RoundSummary } from "@/components/game/round-summary";
import { TappableVirus, type ActiveVirus } from "@/components/game/tappable-virus";
import {
  RoundPhase,
  BossOutcome,
  BossShape,
  BOSS_SHAPES,
  GAME_CONFIG,
} from "@/constants/game";
import { getLiveRank, getPlayersBeaten } from "@/utils/game";
import { MOCK_ATTENDEE, MOCK_LEADERBOARD } from "@/data/event";

interface ScorePopupData {
  id: number;
  xPct: number;
  yPct: number;
  amount: number;
}

/**
 * Screen 4 — the live Virus Fight round. A client-side state machine:
 *   Intro (countdown) → Active (tap mini-viruses) → Boss (draw the shape) →
 *   back to Active → Ended (summary). The round clock pauses during the boss
 *   fight, which runs on its own timer.
 */
export function VirusFightGame() {
  const firstName = MOCK_ATTENDEE.name.split(" ")[0];

  const [phase, setPhase] = useState<RoundPhase>(RoundPhase.Intro);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(GAME_CONFIG.roundSeconds);
  const [introCount, setIntroCount] = useState<number>(GAME_CONFIG.introSeconds);
  const [viruses, setViruses] = useState<ActiveVirus[]>([]);
  const [popups, setPopups] = useState<ScorePopupData[]>([]);
  const [requiredShape, setRequiredShape] = useState<BossShape | null>(null);
  const [bossOutcome, setBossOutcome] = useState<BossOutcome>(BossOutcome.Pending);
  const [bossTimeLeft, setBossTimeLeft] = useState<number>(GAME_CONFIG.bossTimeLimitSeconds);
  const [bossDefeated, setBossDefeated] = useState(false);

  const bossSpawnedRef = useRef(false);
  const idRef = useRef(0);
  // Live mirrors of the two countdowns, so the timer callbacks can branch on the
  // latest value without reacting to state from an effect body (cascading renders).
  const timeRef = useRef<number>(GAME_CONFIG.roundSeconds);
  const bossTimeRef = useRef<number>(GAME_CONFIG.bossTimeLimitSeconds);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rank = getLiveRank(score, MOCK_LEADERBOARD);
  const playersBeaten = getPlayersBeaten(score, MOCK_LEADERBOARD);

  const createVirus = useCallback((): ActiveVirus => {
    idRef.current += 1;
    return {
      id: idRef.current,
      xPct: 8 + Math.random() * 84,
      yPct: 10 + Math.random() * 78,
      size: 44 + Math.random() * 26,
      floatDelay: Math.random() * 2000,
      floatDuration: 3000 + Math.random() * 1600,
    };
  }, []);

  const scheduleReturnToActive = useCallback(() => {
    returnTimerRef.current = setTimeout(() => {
      setRequiredShape(null);
      setPhase(RoundPhase.Active);
    }, GAME_CONFIG.bossResolveDelayMs);
  }, []);

  const handleBossDefeat = useCallback(() => {
    setScore((s) => s + GAME_CONFIG.bossBonusPoints);
    setBossDefeated(true);
    setBossOutcome(BossOutcome.Defeated);
    scheduleReturnToActive();
  }, [scheduleReturnToActive]);

  const handleBossEscape = useCallback(() => {
    setBossOutcome(BossOutcome.Escaped);
    scheduleReturnToActive();
  }, [scheduleReturnToActive]);

  // --- Intro countdown: 3 → 2 → 1 → GO! → Active (seeds the first viruses) ---
  useEffect(() => {
    if (phase !== RoundPhase.Intro) return;
    if (introCount <= 0) {
      const t = setTimeout(() => {
        setViruses([createVirus(), createVirus(), createVirus()]);
        setPhase(RoundPhase.Active);
      }, 600); // hold "GO!"
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setIntroCount((c) => c - 1), 900);
    return () => clearTimeout(t);
  }, [phase, introCount, createVirus]);

  // --- Round clock: tick down, spawn the boss partway, end at zero. Pauses
  //     during the boss fight (this effect only runs while Active). ---
  useEffect(() => {
    if (phase !== RoundPhase.Active) return;
    const id = setInterval(() => {
      const next = Math.max(0, timeRef.current - 1);
      timeRef.current = next;
      setTimeRemaining(next);
      if (next <= 0) {
        setPhase(RoundPhase.Ended);
        return;
      }
      if (next <= GAME_CONFIG.bossSpawnAtSecondsRemaining && !bossSpawnedRef.current) {
        bossSpawnedRef.current = true;
        bossTimeRef.current = GAME_CONFIG.bossTimeLimitSeconds;
        setBossTimeLeft(GAME_CONFIG.bossTimeLimitSeconds);
        setBossOutcome(BossOutcome.Pending);
        setRequiredShape(BOSS_SHAPES[Math.floor(Math.random() * BOSS_SHAPES.length)]);
        setPhase(RoundPhase.Boss);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  // --- Mini-virus spawner: trickle new viruses in, cycling the oldest out ---
  useEffect(() => {
    if (phase !== RoundPhase.Active) return;
    const id = setInterval(() => {
      setViruses((prev) => {
        const trimmed =
          prev.length >= GAME_CONFIG.maxVirusesOnScreen ? prev.slice(1) : prev;
        return [...trimmed, createVirus()];
      });
    }, GAME_CONFIG.virusSpawnIntervalMs);
    return () => clearInterval(id);
  }, [phase, createVirus]);

  // --- Boss timer: count down the draw window; escape (no bonus) at zero ---
  useEffect(() => {
    if (phase !== RoundPhase.Boss || bossOutcome !== BossOutcome.Pending) return;
    const id = setInterval(() => {
      const next = Math.max(0, bossTimeRef.current - 1);
      bossTimeRef.current = next;
      setBossTimeLeft(next);
      if (next <= 0) handleBossEscape();
    }, 1000);
    return () => clearInterval(id);
  }, [phase, bossOutcome, handleBossEscape]);

  // --- Score popups fade out after their lifetime ---
  useEffect(() => {
    if (popups.length === 0) return;
    const id = setTimeout(() => setPopups((p) => p.slice(1)), GAME_CONFIG.popupLifetimeMs);
    return () => clearTimeout(id);
  }, [popups]);

  // --- Clear any pending boss-return timer on unmount ---
  useEffect(
    () => () => {
      if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    },
    [],
  );

  const handlePop = useCallback((virus: ActiveVirus) => {
    setViruses((prev) => prev.filter((v) => v.id !== virus.id));
    setScore((s) => s + GAME_CONFIG.pointsPerVirus);
    idRef.current += 1;
    setPopups((prev) => [
      ...prev,
      { id: idRef.current, xPct: virus.xPct, yPct: virus.yPct, amount: GAME_CONFIG.pointsPerVirus },
    ]);
  }, []);

  const handleReplay = useCallback(() => {
    if (returnTimerRef.current) clearTimeout(returnTimerRef.current);
    bossSpawnedRef.current = false;
    timeRef.current = GAME_CONFIG.roundSeconds;
    bossTimeRef.current = GAME_CONFIG.bossTimeLimitSeconds;
    setScore(0);
    setTimeRemaining(GAME_CONFIG.roundSeconds);
    setIntroCount(GAME_CONFIG.introSeconds);
    setViruses([]);
    setPopups([]);
    setRequiredShape(null);
    setBossOutcome(BossOutcome.Pending);
    setBossTimeLeft(GAME_CONFIG.bossTimeLimitSeconds);
    setBossDefeated(false);
    setPhase(RoundPhase.Intro);
  }, []);

  return (
    <div className="relative flex flex-1 flex-col gap-3 px-4 pb-4 pt-4">
      <GameHud score={score} timeRemaining={timeRemaining} rank={rank} />

      {/* Arena */}
      <div className="relative min-h-[24rem] flex-1 overflow-hidden rounded-3xl border border-border/60 bg-white/35 shadow-soft">
        {viruses.map((virus) => (
          <TappableVirus key={virus.id} virus={virus} onPop={handlePop} />
        ))}

        {popups.map((popup) => (
          <span
            key={popup.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${popup.xPct}%`, top: `${popup.yPct}%` }}
          >
            <span className="animate-pop-rise block font-mono text-base font-bold text-teal-600">
              +{popup.amount}
            </span>
          </span>
        ))}

        {phase === RoundPhase.Boss && requiredShape ? (
          <BossFight
            requiredShape={requiredShape}
            secondsLeft={bossTimeLeft}
            outcome={bossOutcome}
            onDefeat={handleBossDefeat}
          />
        ) : null}
      </div>

      {phase === RoundPhase.Intro ? (
        <GameIntro name={firstName} count={introCount} />
      ) : null}

      {phase === RoundPhase.Ended ? (
        <RoundSummary
          name={firstName}
          score={score}
          rank={rank}
          playersBeaten={playersBeaten}
          bossDefeated={bossDefeated}
          onReplay={handleReplay}
        />
      ) : null}
    </div>
  );
}
