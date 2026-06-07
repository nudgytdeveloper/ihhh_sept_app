"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { toast } from "sonner";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { WelcomeGate } from "@/components/navigator/welcome-gate";
import { EventPhase, PHASE_ORDER } from "@/constants/phases";
import { AvatarMood } from "@/constants/statuses";
import { HOST_REMINDERS } from "@/constants/host";
import { useGameChannel } from "@/utils/use-game-channel";
import { usePlayerIdentity } from "@/utils/player-identity";
import { speakLine } from "@/utils/navi-voice";
import type { ScoreEntry } from "@/types";

/**
 * Live event phase for the attendee area, driven by the host over the realtime
 * channel. Defaults to the first phase until the host advances it.
 */
const EventPhaseContext = createContext<EventPhase>(PHASE_ORDER[0]);

/** The shared live leaderboard (server-aggregated), empty until scores arrive. */
const LiveLeaderboardContext = createContext<ScoreEntry[]>([]);

/** Live count of connected attendee devices (server-tracked), 0 until known. */
const PlayerCountContext = createContext<number>(0);

/** The current host-driven event journey phase (read by the navigator screens). */
export function useEventPhase(): EventPhase {
  return useContext(EventPhaseContext);
}

/** The shared live leaderboard (read by the home game-preview peek). */
export function useLiveLeaderboard(): ScoreEntry[] {
  return useContext(LiveLeaderboardContext);
}

/**
 * Live count of attendee devices currently connected (the host excluded). 0 means
 * "not known yet" — over SSE the real count (≥ this device) arrives on connect;
 * the same-browser broadcast fallback has no server to count, so it stays 0.
 */
export function usePlayerCount(): number {
  return useContext(PlayerCountContext);
}

/**
 * Shell wrapper for every attendee screen. It owns the single realtime
 * subscription for the attendee area — receiving the host-driven event phase
 * (shared via context) and surfacing host-pushed reminders as a toast + Navi
 * voice line on whatever screen the attendee is on. It also gates the app behind
 * the welcome step until the attendee has entered their name.
 */
export function AttendeeShell({ children }: { children: React.ReactNode }) {
  const identity = usePlayerIdentity();
  const [phase, setPhase] = useState<EventPhase>(PHASE_ORDER[0]);
  const [liveScores, setLiveScores] = useState<ScoreEntry[]>([]);
  const [playerCount, setPlayerCount] = useState(0);

  const onPhase = useCallback((next: EventPhase) => setPhase(next), []);
  const onLeaderboard = useCallback((entries: ScoreEntry[]) => setLiveScores(entries), []);
  const onPresence = useCallback((count: number) => setPlayerCount(count), []);
  const onReminder = useCallback((reminderId: string) => {
    const reminder = HOST_REMINDERS.find((item) => item.id === reminderId);
    if (!reminder) return;
    toast(reminder.label, { description: reminder.detail });
    speakLine(`${reminder.label}. ${reminder.detail}.`);
  }, []);

  // Pass this device's id (once hydrated) so the server counts it toward the live
  // headcount — this is the one always-mounted attendee subscription, so it is
  // the device's presence signal across every attendee screen.
  useGameChannel({
    playerId: identity.id || undefined,
    onPhase,
    onReminder,
    onLeaderboard,
    onPresence,
  });

  const loaded = identity.id !== "";

  return (
    <EventPhaseContext.Provider value={phase}>
      <LiveLeaderboardContext.Provider value={liveScores}>
        <PlayerCountContext.Provider value={playerCount}>
          {!loaded ? (
            <ShellSplash />
          ) : !identity.onboarded ? (
            <WelcomeGate />
          ) : (
            children
          )}
        </PlayerCountContext.Provider>
      </LiveLeaderboardContext.Provider>
    </EventPhaseContext.Provider>
  );
}

/** Brief neutral splash shown before the persisted identity resolves on the client. */
function ShellSplash() {
  return (
    <div className="flex flex-1 items-center justify-center py-20">
      <AvatarHost mood={AvatarMood.Welcoming} className="size-20 animate-float opacity-80" />
    </div>
  );
}
