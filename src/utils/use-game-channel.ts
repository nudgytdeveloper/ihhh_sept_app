"use client";

import { useCallback, useEffect, useRef } from "react";
import { RealtimeMessage } from "@/constants/realtime";
import { GameChannel } from "@/utils/realtime";
import type { EventPhase } from "@/constants/phases";
import type { GameSessionState, ScoreEntry } from "@/types";

export interface GameChannelHandlers {
  /** A live session snapshot arrived from the host. */
  onState?: (state: GameSessionState) => void;
  /** The host pushed a reminder. */
  onReminder?: (reminderId: string) => void;
  /** The aggregated shared leaderboard changed (from the server). */
  onLeaderboard?: (entries: ScoreEntry[]) => void;
  /** The host advanced the event journey phase. */
  onPhase?: (phase: EventPhase) => void;
  /** The live count of connected attendees changed (from the server). */
  onPresence?: (count: number) => void;
  /**
   * A late-joining attendee asked for the current snapshot. Host-only: return the
   * latest session to re-share it. Attendees omit this.
   */
  getStateForSync?: () => GameSessionState;
  /**
   * This device's player id (attendees only). Forwarded to the server so it is
   * counted toward the live presence headcount; the host omits it. Changing it
   * (e.g. once the persisted identity hydrates) reconnects the channel.
   */
  playerId?: string;
}

/**
 * Subscribe to the realtime game channel and get stable publish helpers.
 *
 * All inbound handling runs from message events (never synchronously in an effect
 * body), so consumers can call setState inside the handlers freely. Handlers are
 * read from a ref, so passing fresh closures each render never re-subscribes.
 */
export function useGameChannel(handlers: GameChannelHandlers = {}) {
  const handlersRef = useRef(handlers);
  const channelRef = useRef<GameChannel | null>(null);
  const playerId = handlers.playerId;

  // Keep the latest handlers without re-subscribing (refs are touched in effects,
  // never during render).
  useEffect(() => {
    handlersRef.current = handlers;
  });

  // Re-runs only when playerId changes (e.g. "" → real id once identity hydrates),
  // so the connection carries this device's id for the presence headcount.
  useEffect(() => {
    const channel = new GameChannel(playerId);
    channelRef.current = channel;

    const unsubscribe = channel.subscribe((message) => {
      const current = handlersRef.current;
      if (message.type === RealtimeMessage.State) {
        current.onState?.(message.state);
      } else if (message.type === RealtimeMessage.Reminder) {
        current.onReminder?.(message.reminderId);
      } else if (message.type === RealtimeMessage.Leaderboard) {
        current.onLeaderboard?.(message.entries);
      } else if (message.type === RealtimeMessage.Phase) {
        current.onPhase?.(message.phase);
      } else if (message.type === RealtimeMessage.Presence) {
        current.onPresence?.(message.count);
      } else if (message.type === RealtimeMessage.RequestState) {
        const snapshot = current.getStateForSync?.();
        if (snapshot) channel.publishState(snapshot);
      }
    });

    // Ask any host that's already open to share the current session.
    channel.requestState();

    return () => {
      unsubscribe();
      channel.close();
      channelRef.current = null;
    };
  }, [playerId]);

  const publishState = useCallback((state: GameSessionState) => {
    channelRef.current?.publishState(state);
  }, []);

  const pushReminder = useCallback((reminderId: string) => {
    channelRef.current?.publishReminder(reminderId);
  }, []);

  const publishScore = useCallback((entry: ScoreEntry) => {
    channelRef.current?.publishScore(entry);
  }, []);

  const publishPhase = useCallback((phase: EventPhase) => {
    channelRef.current?.publishPhase(phase);
  }, []);

  return { publishState, pushReminder, publishScore, publishPhase };
}
