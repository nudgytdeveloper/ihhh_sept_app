"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Radio } from "lucide-react";
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
  BOSS_NAME,
  SHAPE_META,
  GameStatus,
  GAME_CONFIG,
} from "@/constants/game";
import { GAME_SCRIPTS } from "@/constants/avatar-scripts";
import { PLAYER_NAME_FALLBACK } from "@/constants/player";
import {
  getLiveRank,
  getPlayersBeaten,
  getRankAmong,
  getPlayersBeatenAmong,
} from "@/utils/game";
import { template } from "@/utils/format";
import { useGameChannel } from "@/utils/use-game-channel";
import { usePlayerIdentity } from "@/utils/player-identity";
import { speakLine } from "@/utils/navi-voice";
import { MOCK_LEADERBOARD } from "@/data/event";
import type { GameSessionState, ScoreEntry } from "@/types";

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
 *
 * When the Host Control Panel (Screen 5) is open in another tab/window, it drives
 * this round live over the realtime channel: the host unleashes the boss (with a
 * chosen shape), resumes the round, and ends the game. With no host connected the
 * round auto-runs on its own (spawning the boss partway through), so the screen
 * still works standalone.
 */
export function VirusFightGame() {
  // Per-device identity for the shared leaderboard (SSR-safe; `id === ""` until
  // hydrated, when it renders the placeholder handle).
  const identity = usePlayerIdentity();
  const firstName = (identity.name || PLAYER_NAME_FALLBACK).split(" ")[0];

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
  const [hostConnected, setHostConnected] = useState(false);
  const [liveEntries, setLiveEntries] = useState<ScoreEntry[]>([]);

  const bossSpawnedRef = useRef(false);
  const idRef = useRef(0);
  // Live mirror of the score + the last value flushed to the shared board.
  const scoreRef = useRef(0);
  const lastSentRef = useRef<number>(-1);
  // Live mirrors of the two countdowns, so the timer callbacks can branch on the
  // latest value without reacting to state from an effect body (cascading renders).
  const timeRef = useRef<number>(GAME_CONFIG.roundSeconds);
  const bossTimeRef = useRef<number>(GAME_CONFIG.bossTimeLimitSeconds);
  const returnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest values the realtime handler reads without re-subscribing.
  const phaseRef = useRef<RoundPhase>(phase);
  const bossOutcomeRef = useRef<BossOutcome>(bossOutcome);
  const hostConnectedRef = useRef(false);
  const lastHostStatusRef = useRef<GameStatus | null>(null);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);
  useEffect(() => {
    bossOutcomeRef.current = bossOutcome;
  }, [bossOutcome]);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Rank against the shared live board when other players are present; otherwise
  // fall back to the mock competitors so a solo run still feels alive.
  const myId = identity.id;
  const liveOthers = liveEntries.filter((entry) => entry.playerId !== myId);
  const rank =
    liveOthers.length > 0
      ? getRankAmong(score, liveEntries, myId)
      : getLiveRank(score, MOCK_LEADERBOARD);
  const playersBeaten =
    liveOthers.length > 0
      ? getPlayersBeatenAmong(score, liveEntries, myId)
      : getPlayersBeaten(score, MOCK_LEADERBOARD);

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

  // Drop into the boss fight with a given shape (used by both the solo auto-spawn
  // and the host's "unleash boss" command). Navi calls out the warning.
  const spawnBoss = useCallback((shape: BossShape) => {
    bossSpawnedRef.current = true;
    bossTimeRef.current = GAME_CONFIG.bossTimeLimitSeconds;
    setBossTimeLeft(GAME_CONFIG.bossTimeLimitSeconds);
    setBossOutcome(BossOutcome.Pending);
    setRequiredShape(shape);
    setPhase(RoundPhase.Boss);
    speakLine(
      template(GAME_SCRIPTS.bossWarning, {
        shape: SHAPE_META[shape].label.toLowerCase(),
        boss: BOSS_NAME,
      }),
    );
  }, []);

  const endRound = useCallback(() => {
    setPhase(RoundPhase.Ended);
    speakLine(template(GAME_SCRIPTS.gameOver, { name: firstName }));
  }, [firstName]);

  const handleBossDefeat = useCallback(() => {
    setScore((s) => s + GAME_CONFIG.bossBonusPoints);
    setBossDefeated(true);
    setBossOutcome(BossOutcome.Defeated);
    speakLine(template(GAME_SCRIPTS.bossDefeated, { boss: BOSS_NAME }));
    scheduleReturnToActive();
  }, [scheduleReturnToActive]);

  const handleBossEscape = useCallback(() => {
    setBossOutcome(BossOutcome.Escaped);
    speakLine(GAME_SCRIPTS.bossEscaped);
    scheduleReturnToActive();
  }, [scheduleReturnToActive]);

  // --- Realtime: the host (Screen 5) drives the boss + end of the round ---
  const handleHostState = useCallback(
    (state: GameSessionState) => {
      setHostConnected(true);
      hostConnectedRef.current = true;
      const prev = lastHostStatusRef.current;
      lastHostStatusRef.current = state.status;

      // Host unleashed the boss → drop into the boss fight with the host's shape.
      if (
        state.status === GameStatus.BossActive &&
        prev !== GameStatus.BossActive &&
        state.requiredShape &&
        phaseRef.current === RoundPhase.Active
      ) {
        spawnBoss(state.requiredShape);
        toast.warning(`${BOSS_NAME} incoming!`, {
          description: `Draw the ${SHAPE_META[state.requiredShape].label.toLowerCase()} to defeat it.`,
        });
        return;
      }

      // Host resumed the round while the boss was still live → it slips away.
      if (
        prev === GameStatus.BossActive &&
        state.status === GameStatus.Active &&
        phaseRef.current === RoundPhase.Boss &&
        bossOutcomeRef.current === BossOutcome.Pending
      ) {
        handleBossEscape();
        return;
      }

      // Host ended / locked the game → wrap the round.
      if (
        (state.status === GameStatus.Ended || state.status === GameStatus.Locked) &&
        prev !== GameStatus.Ended &&
        prev !== GameStatus.Locked &&
        phaseRef.current !== RoundPhase.Ended
      ) {
        endRound();
      }
    },
    [spawnBoss, handleBossEscape, endRound],
  );

  const handleLeaderboard = useCallback((entries: ScoreEntry[]) => {
    setLiveEntries(entries);
  }, []);

  const { publishScore } = useGameChannel({
    onState: handleHostState,
    onLeaderboard: handleLeaderboard,
  });

  // --- Greeting: Navi gets the attendee ready as the round opens ---
  useEffect(() => {
    if (!identity.id) return;
    speakLine(template(GAME_SCRIPTS.getReady, { name: firstName }));
  }, [identity.id, firstName]);

  // --- Report this device's score into the shared live leaderboard, throttled.
  //     The first tick registers the player (score 0) so they appear on the board.
  useEffect(() => {
    if (!identity.id) return;
    if (phase !== RoundPhase.Active && phase !== RoundPhase.Boss) return;
    const id = setInterval(() => {
      if (scoreRef.current === lastSentRef.current) return;
      lastSentRef.current = scoreRef.current;
      publishScore({ playerId: identity.id, name: identity.name, score: scoreRef.current });
    }, GAME_CONFIG.scoreSyncIntervalMs);
    return () => clearInterval(id);
  }, [phase, identity, publishScore]);

  // --- Flush the final score once the round ends ---
  useEffect(() => {
    if (phase !== RoundPhase.Ended || !identity.id) return;
    if (scoreRef.current === lastSentRef.current) return;
    lastSentRef.current = scoreRef.current;
    publishScore({ playerId: identity.id, name: identity.name, score: scoreRef.current });
  }, [phase, identity, publishScore]);

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

  // --- Round clock: tick down, end at zero. Spawns the boss partway only when
  //     no host is connected (otherwise the host unleashes it). Pauses during
  //     the boss fight (this effect only runs while Active). ---
  useEffect(() => {
    if (phase !== RoundPhase.Active) return;
    const id = setInterval(() => {
      const next = Math.max(0, timeRef.current - 1);
      timeRef.current = next;
      setTimeRemaining(next);
      if (next <= 0) {
        endRound();
        return;
      }
      if (
        !hostConnectedRef.current &&
        !bossSpawnedRef.current &&
        next <= GAME_CONFIG.bossSpawnAtSecondsRemaining
      ) {
        spawnBoss(BOSS_SHAPES[Math.floor(Math.random() * BOSS_SHAPES.length)]);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [phase, endRound, spawnBoss]);

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
    lastHostStatusRef.current = null;
    scoreRef.current = 0;
    lastSentRef.current = -1;
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
      {hostConnected ? (
        <div className="flex items-center justify-center gap-1.5">
          <span className="relative flex size-2">
            <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400/70" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <Radio className="size-3" /> Live · hosted from the control room
          </span>
        </div>
      ) : null}

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
