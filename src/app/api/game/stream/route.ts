import { addSubscriber, getCurrentState, getLeaderboard } from "@/server/game-hub";
import { RealtimeMessage } from "@/constants/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * SSE stream for host + attendees: replays the current session to the new client,
 * then pushes live host updates (state / reminder) as named events.
 */
export async function GET() {
  const encoder = new TextEncoder();
  let teardown = () => {};

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
      };

      // Sync the newly-connected client with the current session + board, if any.
      const current = getCurrentState();
      if (current) send(RealtimeMessage.State, current);
      const board = getLeaderboard();
      if (board.length > 0) send(RealtimeMessage.Leaderboard, board);

      const remove = addSubscriber(send);
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
