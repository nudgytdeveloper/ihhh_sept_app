import {
  REALTIME_CHANNEL,
  REALTIME_PUBLISH_PATH,
  REALTIME_SSE_PATH,
  REALTIME_TRANSPORT,
  RealtimeMessage,
  RealtimeTransport,
} from "@/constants/realtime";
import type { EventPhase } from "@/constants/phases";
import type { GameSessionState, ScoreEntry } from "@/types";

/** A message exchanged over the realtime game channel. */
export type RealtimeChannelMessage =
  | { type: RealtimeMessage.State; state: GameSessionState }
  | { type: RealtimeMessage.Reminder; reminderId: string }
  | { type: RealtimeMessage.RequestState }
  | { type: RealtimeMessage.Score; entry: ScoreEntry }
  | { type: RealtimeMessage.Leaderboard; entries: ScoreEntry[] }
  | { type: RealtimeMessage.Phase; phase: EventPhase }
  | { type: RealtimeMessage.Presence; count: number };

export type RealtimeHandler = (message: RealtimeChannelMessage) => void;

/** Whether the current environment can run a realtime transport (client only). */
export function supportsRealtime(): boolean {
  return typeof window !== "undefined";
}

interface Transport {
  subscribe(handler: RealtimeHandler): () => void;
  publishState(state: GameSessionState): void;
  publishReminder(reminderId: string): void;
  publishScore(entry: ScoreEntry): void;
  publishPhase(phase: EventPhase): void;
  requestState(): void;
  close(): void;
}

/* ------ Same-browser transport (BroadcastChannel) — local-dev fallback ----- */
class BroadcastTransport implements Transport {
  private channel: BroadcastChannel | null;

  constructor() {
    this.channel =
      typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(REALTIME_CHANNEL) : null;
  }
  subscribe(handler: RealtimeHandler): () => void {
    const channel = this.channel;
    if (!channel) return () => {};
    const listener = (event: MessageEvent<RealtimeChannelMessage>) => handler(event.data);
    channel.addEventListener("message", listener);
    return () => channel.removeEventListener("message", listener);
  }
  publishState(state: GameSessionState): void {
    this.channel?.postMessage({ type: RealtimeMessage.State, state });
  }
  publishReminder(reminderId: string): void {
    this.channel?.postMessage({ type: RealtimeMessage.Reminder, reminderId });
  }
  publishScore(entry: ScoreEntry): void {
    // No server to aggregate in same-browser mode; relayed for completeness.
    this.channel?.postMessage({ type: RealtimeMessage.Score, entry });
  }
  publishPhase(phase: EventPhase): void {
    this.channel?.postMessage({ type: RealtimeMessage.Phase, phase });
  }
  requestState(): void {
    this.channel?.postMessage({ type: RealtimeMessage.RequestState });
  }
  close(): void {
    this.channel?.close();
    this.channel = null;
  }
}

/* -------- Cross-device transport (SSE in, POST out) — Render-ready --------- */
class SseTransport implements Transport {
  private source: EventSource | null = null;
  private handlers = new Set<RealtimeHandler>();

  /** `playerId` (attendees only) is sent so the server counts live presence; the
   *  host omits it and is not counted toward the headcount. */
  constructor(playerId?: string) {
    if (typeof window === "undefined" || typeof EventSource === "undefined") return;
    const url = playerId
      ? `${REALTIME_SSE_PATH}?playerId=${encodeURIComponent(playerId)}`
      : REALTIME_SSE_PATH;
    const source = new EventSource(url);
    source.addEventListener(RealtimeMessage.State, (event) => {
      this.emit({ type: RealtimeMessage.State, state: JSON.parse((event as MessageEvent).data) });
    });
    source.addEventListener(RealtimeMessage.Reminder, (event) => {
      const { reminderId } = JSON.parse((event as MessageEvent).data);
      this.emit({ type: RealtimeMessage.Reminder, reminderId });
    });
    source.addEventListener(RealtimeMessage.Leaderboard, (event) => {
      this.emit({
        type: RealtimeMessage.Leaderboard,
        entries: JSON.parse((event as MessageEvent).data),
      });
    });
    source.addEventListener(RealtimeMessage.Phase, (event) => {
      const { phase } = JSON.parse((event as MessageEvent).data);
      this.emit({ type: RealtimeMessage.Phase, phase });
    });
    source.addEventListener(RealtimeMessage.Presence, (event) => {
      const { count } = JSON.parse((event as MessageEvent).data);
      this.emit({ type: RealtimeMessage.Presence, count });
    });
    this.source = source;
  }
  private emit(message: RealtimeChannelMessage): void {
    this.handlers.forEach((handler) => handler(message));
  }
  private post(body: object): void {
    void fetch(REALTIME_PUBLISH_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }
  subscribe(handler: RealtimeHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }
  publishState(state: GameSessionState): void {
    this.post({ type: RealtimeMessage.State, state });
  }
  publishReminder(reminderId: string): void {
    this.post({ type: RealtimeMessage.Reminder, reminderId });
  }
  publishScore(entry: ScoreEntry): void {
    this.post({ type: RealtimeMessage.Score, entry });
  }
  publishPhase(phase: EventPhase): void {
    this.post({ type: RealtimeMessage.Phase, phase });
  }
  requestState(): void {
    // No-op: the server replays the current state + board to every new EventSource.
  }
  close(): void {
    this.source?.close();
    this.source = null;
    this.handlers.clear();
  }
}

/* ---------------------------- SSR / unsupported ---------------------------- */
class NoopTransport implements Transport {
  subscribe(): () => void {
    return () => {};
  }
  publishState(): void {}
  publishReminder(): void {}
  publishScore(): void {}
  publishPhase(): void {}
  requestState(): void {}
  close(): void {}
}

function createTransport(playerId?: string): Transport {
  if (typeof window === "undefined") return new NoopTransport();
  if (REALTIME_TRANSPORT === RealtimeTransport.Broadcast) return new BroadcastTransport();
  if (typeof EventSource !== "undefined") return new SseTransport(playerId);
  return new BroadcastTransport();
}

/**
 * Transport-agnostic host ⇄ attendee game channel. Picks SSE (cross-device, via
 * the Render web service) or BroadcastChannel (same-browser, local dev) based on
 * `REALTIME_TRANSPORT` — callers (`useGameChannel`) don't care which is active.
 *
 * `playerId` (attendees only) is forwarded to the transport so the server counts
 * this device toward the live presence headcount; the host constructs the channel
 * without one.
 */
export class GameChannel {
  private transport: Transport;

  constructor(playerId?: string) {
    this.transport = createTransport(playerId);
  }
  subscribe(handler: RealtimeHandler): () => void {
    return this.transport.subscribe(handler);
  }
  publishState(state: GameSessionState): void {
    this.transport.publishState(state);
  }
  publishReminder(reminderId: string): void {
    this.transport.publishReminder(reminderId);
  }
  publishScore(entry: ScoreEntry): void {
    this.transport.publishScore(entry);
  }
  publishPhase(phase: EventPhase): void {
    this.transport.publishPhase(phase);
  }
  requestState(): void {
    this.transport.requestState();
  }
  close(): void {
    this.transport.close();
  }
}
