import {
  publishCountdown,
  publishPhase,
  publishReminder,
  publishState,
  submitScore,
} from "@/server/game-hub";
import { RealtimeMessage } from "@/constants/realtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Clients publish here: the host POSTs a session snapshot (stored + fanned out)
 * or a one-off reminder; attendees POST their live score (aggregated into the
 * shared leaderboard the server fans back out via the SSE stream).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }
  if (body.type === RealtimeMessage.State && body.state) {
    publishState(body.state);
  } else if (body.type === RealtimeMessage.Reminder && typeof body.reminderId === "string") {
    publishReminder(body.reminderId);
  } else if (body.type === RealtimeMessage.Score && body.entry) {
    submitScore(body.entry);
  } else if (body.type === RealtimeMessage.Phase && typeof body.phase === "string") {
    publishPhase(body.phase);
  } else if (body.type === RealtimeMessage.Countdown && typeof body.seconds === "number") {
    publishCountdown(body.seconds);
  } else {
    return Response.json({ ok: false, error: "unknown message" }, { status: 400 });
  }
  return Response.json({ ok: true });
}
