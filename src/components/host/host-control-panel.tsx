"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Zap, Bell } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HostStatusBanner } from "@/components/host/host-status-banner";
import { BossControl } from "@/components/host/boss-control";
import { HostLeaderboard } from "@/components/host/host-leaderboard";
import { HostActivityLog, type LogEntry } from "@/components/host/host-activity-log";
import {
  GameStatus,
  BossShape,
  SHAPE_META,
  GAME_CONFIG,
  GAME_NAME,
  BOSS_NAME,
} from "@/constants/game";
import { LogTone, HOST_REMINDERS, type HostReminder } from "@/constants/host";
import { getHostControls, getWinner, toLeaderboard } from "@/utils/game";
import { useGameChannel } from "@/utils/use-game-channel";
import { formatScore } from "@/utils/format";
import { MOCK_EVENT_STATE } from "@/data/event";
import type { LeaderboardEntry, GameSessionState, ScoreEntry } from "@/types";

/**
 * Screen 5 — Host Game Control Panel. The host runs the show: start/end the
 * round, spawn virus waves, unleash the COVID Boss with a required shape, lock
 * the leaderboard, announce the winner, and push reminders. All actions drive
 * GameStatus (see getHostControls) — what the attendee game reacts to — with a
 * toast + activity-log entry for feedback.
 */
export function HostControlPanel() {
  const playerCount = MOCK_EVENT_STATE.game.playerCount;

  const [status, setStatus] = useState<GameStatus>(MOCK_EVENT_STATE.game.status);
  const [selectedShape, setSelectedShape] = useState<BossShape>(BossShape.Circle);
  const [activeBossShape, setActiveBossShape] = useState<BossShape | null>(null);
  const [locked, setLocked] = useState(false);
  const [waves, setWaves] = useState(0);
  const [winner, setWinner] = useState<LeaderboardEntry | null>(null);
  const [liveScores, setLiveScores] = useState<ScoreEntry[]>([]);
  const [log, setLog] = useState<LogEntry[]>([]);

  const logIdRef = useRef(0);
  const controls = getHostControls(status);

  // The shared live leaderboard, aggregated server-side from every attendee's
  // score (the host is not a player, so no row is flagged as the current user).
  const leaderboard = toLeaderboard(liveScores, "");

  // Broadcast the live session to attendees (Screen 4) over the realtime channel,
  // and re-share it whenever a late-joining attendee asks (RequestState).
  const session = useMemo<GameSessionState>(
    () => ({
      status,
      requiredShape: activeBossShape,
      waves,
      locked,
      winnerName: winner?.name ?? null,
    }),
    [status, activeBossShape, waves, locked, winner],
  );
  const sessionRef = useRef(session);
  const { publishState, pushReminder } = useGameChannel({
    getStateForSync: () => sessionRef.current,
    onLeaderboard: setLiveScores,
  });
  useEffect(() => {
    sessionRef.current = session;
    publishState(session);
  }, [session, publishState]);

  function addLog(message: string, tone: LogTone) {
    logIdRef.current += 1;
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    setLog((prev) => [{ id: logIdRef.current, message, time, tone }, ...prev].slice(0, 6));
  }

  function handleStart() {
    setStatus(GameStatus.Active);
    toast.success("Round started", { description: `${GAME_NAME} is live.` });
    addLog("Round started", LogTone.Success);
  }

  function handleSpawnWave() {
    setWaves((w) => w + 1);
    toast("Wave released", { description: `${GAME_CONFIG.miniWaveSize} mini-viruses into the arena.` });
    addLog(`Spawned a wave of ${GAME_CONFIG.miniWaveSize} mini-viruses`, LogTone.Info);
  }

  function handleSpawnBoss(shape: BossShape) {
    const label = SHAPE_META[shape].label.toLowerCase();
    setActiveBossShape(shape);
    setStatus(GameStatus.BossActive);
    toast.warning(`${BOSS_NAME} unleashed`, { description: `Attendees must draw the ${label}.` });
    addLog(`Unleashed the ${BOSS_NAME} — draw the ${label}`, LogTone.Danger);
  }

  function handleResume() {
    setActiveBossShape(null);
    setStatus(GameStatus.Active);
    toast("Boss cleared", { description: "Round resumed." });
    addLog("Boss cleared — round resumed", LogTone.Info);
  }

  function handleLock() {
    setLocked(true);
    setStatus(GameStatus.Locked);
    toast("Leaderboard locked", { description: "Scores frozen for final tally." });
    addLog("Leaderboard locked", LogTone.Warn);
  }

  function handleAnnounce() {
    const top = getWinner(leaderboard);
    if (!top) {
      toast("No scores yet", { description: "Wait for attendees to play before announcing." });
      return;
    }
    setWinner(top);
    toast.success(`🏆 ${top.name} wins!`, { description: `${formatScore(top.score)} points` });
    addLog(`Announced winner: ${top.name} (${formatScore(top.score)} pts)`, LogTone.Success);
  }

  function handleEnd() {
    setStatus(GameStatus.Ended);
    toast("Game ended", { description: "Lock the board and announce the winner." });
    addLog("Game ended", LogTone.Warn);
  }

  function handleReset() {
    setStatus(GameStatus.Lobby);
    setWaves(0);
    setLocked(false);
    setActiveBossShape(null);
    setWinner(null);
    toast("New game ready", { description: "Lobby open for the next round." });
    addLog("Reset to lobby", LogTone.Info);
  }

  function handlePushReminder(reminder: HostReminder) {
    pushReminder(reminder.id);
    toast(reminder.label, { description: `Pushed to ${playerCount} attendees · ${reminder.detail}` });
    addLog(`Pushed reminder: ${reminder.label}`, LogTone.Info);
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
      <HostStatusBanner
        status={status}
        controls={controls}
        playerCount={playerCount}
        waves={waves}
        activeBossShape={activeBossShape}
        onStart={handleStart}
        onEnd={handleEnd}
        onReset={handleReset}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mini-virus waves */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="size-4 text-teal-500" />
                  Mini-virus waves
                </CardTitle>
                <CardDescription>
                  Release a burst of {GAME_CONFIG.miniWaveSize} viruses into the arena.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-3xl font-bold tabular-nums">{waves}</p>
                <p className="text-xs text-muted-foreground">waves sent this round</p>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleSpawnWave}
                  disabled={!controls.canSpawnWave}
                  className="bg-teal-500 text-white hover:bg-teal-600"
                >
                  <Zap className="size-4" />
                  Spawn wave
                </Button>
              </CardFooter>
            </Card>

            <BossControl
              controls={controls}
              selectedShape={selectedShape}
              activeBossShape={activeBossShape}
              onSelectShape={setSelectedShape}
              onSpawnBoss={handleSpawnBoss}
              onResume={handleResume}
            />
          </div>

          {/* Reminders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="size-4 text-brand-purple" />
                Push a reminder
              </CardTitle>
              <CardDescription>Broadcast a nudge to all {playerCount} attendees.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2 sm:grid-cols-2">
              {HOST_REMINDERS.map((reminder) => {
                const Icon = reminder.icon;
                return (
                  <Button
                    key={reminder.id}
                    variant="outline"
                    onClick={() => handlePushReminder(reminder)}
                    className="h-auto justify-start gap-2 py-2 text-left"
                  >
                    <Icon className="size-4 text-brand-purple" />
                    <span className="flex flex-col">
                      <span className="text-sm font-medium">{reminder.label}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        {reminder.detail}
                      </span>
                    </span>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard + activity rail */}
        <div className="flex flex-col gap-4">
          <HostLeaderboard
            leaderboard={leaderboard}
            locked={locked}
            controls={controls}
            winner={winner}
            playerCount={leaderboard.length}
            onLock={handleLock}
            onAnnounce={handleAnnounce}
          />
          <HostActivityLog log={log} />
        </div>
      </div>
    </div>
  );
}
