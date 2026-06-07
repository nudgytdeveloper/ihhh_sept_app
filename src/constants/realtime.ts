/**
 * Realtime sync (host → attendee) constants.
 *
 * For the demo the transport is the browser-native BroadcastChannel, which syncs
 * the Host Control Panel (Screen 5) and the attendee game (Screen 4) live across
 * tabs/windows of the same browser — zero backend. The `GameChannel` abstraction
 * in `@/utils/realtime` hides the transport, so a networked backend
 * (Socket.io / Supabase Realtime) can replace it later without touching screens.
 */

/** BroadcastChannel name shared by the host + all attendees. */
export const REALTIME_CHANNEL = "ihhh:virus-fight";

/** Message kinds carried over the realtime channel. */
export enum RealtimeMessage {
  /** Host broadcasting the current session snapshot. */
  State = "state",
  /** Host pushing a one-off reminder to attendees. */
  Reminder = "reminder",
  /** A late-joining attendee asking the host to re-share the current snapshot. */
  RequestState = "request_state",
  /** An attendee reporting their live score (attendee → server). */
  Score = "score",
  /** The server fanning out the aggregated shared leaderboard (server → all). */
  Leaderboard = "leaderboard",
  /** Host driving the current event journey phase for every attendee. */
  Phase = "phase",
  /** The server fanning out the live count of connected attendees (server → all). */
  Presence = "presence",
}

/** Available realtime transports (selected behind the GameChannel facade). */
export enum RealtimeTransport {
  /** Cross-device: SSE from a Next route handler + in-memory pub/sub (Render). */
  Sse = "sse",
  /** Same-browser only: BroadcastChannel (local-dev fallback, no server). */
  Broadcast = "broadcast",
}

/** SSE subscribe endpoint — host + attendees listen here. */
export const REALTIME_SSE_PATH = "/api/game/stream";
/** Publish endpoint — the host POSTs state + reminders here. */
export const REALTIME_PUBLISH_PATH = "/api/game/publish";

/**
 * Active transport. Defaults to SSE (cross-device — works on a Render web service
 * and locally). Set `NEXT_PUBLIC_REALTIME_TRANSPORT=broadcast` to force the
 * same-browser BroadcastChannel mode for offline local dev.
 */
export const REALTIME_TRANSPORT: RealtimeTransport =
  process.env.NEXT_PUBLIC_REALTIME_TRANSPORT === RealtimeTransport.Broadcast
    ? RealtimeTransport.Broadcast
    : RealtimeTransport.Sse;
