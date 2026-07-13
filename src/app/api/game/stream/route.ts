import {
  addSubscriber,
  getCurrentPhase,
  getCurrentState,
  getLeaderboard,
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
      const phase = getCurrentPhase();
      if (phase) send(RealtimeMessage.Phase, { phase });
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
