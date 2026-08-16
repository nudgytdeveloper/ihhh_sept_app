import {
  addSubscriber,
  ensurePhaseClock,
  ensureScoresHydrated,
  getCurrentState,
  getLeaderboard,
  getPhaseSnapshot,
  getPresenceCount,
} from "@/server/game-hub";
import { getDb } from "@/server/db";
import { markCheckedIn } from "@/server/db/attendees";
import { RealtimeMessage } from "@/constants/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream for host + attendees: replays the current session to the new client,
 * then pushes live host updates (state / reminder / presence) as named events.
 * Attendees pass `?playerId=` so they are counted toward the live headcount; the
 * host connects without one and is not counted.
 */
export async function GET(request: Request) {
  // Restore persisted totals before replaying the board, so a client that
  // connects right after a restart sees real scores rather than an empty board.
  await ensureScoresHydrated();
  // The programme clock advances the journey on its own — make sure it's ticking
  // in the instance that's actually serving connections.
  ensurePhaseClock();

  const playerId = new URL(request.url).searchParams.get("playerId") ?? undefined;
  // Attendance: a registered attendee's first live connection is the check-in.
  // Fire-and-forget — the stream must never wait on (or fail with) the database.
  if (playerId) {
    const db = getDb();
    if (db) {
      void markCheckedIn(db, playerId).catch((error) => {
        console.error("check-in stamp failed", error);
      });
    }
  }
  const encoder = new TextEncoder();
  let teardown = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Sync the newly-connected client with the current phase + session + board.
      // The phase is always known (the clock resolves one), so an attendee who
      // opens the app mid-event lands on the right phase with no host action.
      send(RealtimeMessage.Phase, getPhaseSnapshot());
      const current = getCurrentState();
      if (current) send(RealtimeMessage.State, current);
      const board = getLeaderboard();
      if (board.length > 0) send(RealtimeMessage.Leaderboard, board);

      // Registers this device for presence (when it's an attendee) and broadcasts
      // the change; then replay the current headcount so even a no-change join
      // (e.g. a second tab of the same device) knows the count.
      const remove = addSubscriber(send, playerId);
      send(RealtimeMessage.Presence, { count: getPresenceCount() });
      // Heartbeat keeps the connection alive through proxies / load balancers.
      const ping = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: ping\n\n`));
        } catch {
          teardown();
        }
      }, 25000);

      teardown = () => {
        clearInterval(ping);
        remove();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
    },
    cancel() {
      teardown();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
