import {
  publishCountdown,
  publishPhase,
  publishReminder,
  publishState,
  submitScore,
} from "@/server/game-hub";
import { getDb } from "@/server/db";
import { upsertBestScore } from "@/server/db/scores";
import { sendPhasePush, sendReminderPush } from "@/server/push/send";
import { isValidHostToken } from "@/server/host-auth";
import { RealtimeMessage } from "@/constants/realtime";
import { HOST_ONLY_MESSAGE_TYPES, HOST_TOKEN_HEADER } from "@/constants/host-auth";
import type { EventPhase } from "@/constants/phases";
import type { ScoreEntry } from "@/types";

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
  // Host-only actions (phase / reminders / game state / countdown — anything that
  // drives every attendee, incl. fanning a push to every phone) require the host
  // passcode. Attendee score posts are exempt, so they never need it.
  if (
    HOST_ONLY_MESSAGE_TYPES.includes(body.type) &&
    !isValidHostToken(request.headers.get(HOST_TOKEN_HEADER))
  ) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (body.type === RealtimeMessage.State && body.state) {
    publishState(body.state);
  } else if (body.type === RealtimeMessage.Reminder && typeof body.reminderId === "string") {
    publishReminder(body.reminderId);
    // Also push it to phones (even backgrounded/closed) — fire-and-forget.
    void sendReminderPush(body.reminderId).catch(() => {});
  } else if (body.type === RealtimeMessage.Score && body.entry) {
    if (submitScore(body.entry)) persistScore(body.entry);
  } else if (body.type === RealtimeMessage.Phase && typeof body.phase === "string") {
    publishPhase(body.phase);
    // "What's next" phone notification for every attendee — fire-and-forget.
    void sendPhasePush(body.phase as EventPhase).catch(() => {});
  } else if (body.type === RealtimeMessage.Countdown && typeof body.seconds === "number") {
    publishCountdown(body.seconds);
  } else {
    return Response.json({ ok: false, error: "unknown message" }, { status: 400 });
  }
  return Response.json({ ok: true });
}

/**
 * Write-through: keep the player's best score in Postgres so the roster
 * survives restarts and round resets. Fire-and-forget — the live board must
 * never wait on (or fail with) the database; no DB configured is a no-op.
 */
function persistScore(entry: ScoreEntry): void {
  const db = getDb();
  if (!db) return;
  void upsertBestScore(db, entry).catch((error) => {
    console.error("score persist failed", error);
  });
}
