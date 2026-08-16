import {
  clearAllScores,
  ensurePhaseClock,
  ensureScoresHydrated,
  publishCountdown,
  publishReminder,
  publishState,
  setPhaseControl,
  submitScore,
} from "@/server/game-hub";
import { getDb } from "@/server/db";
import { deleteAllScores, upsertTotalScore } from "@/server/db/scores";
import { sendPhasePush, sendReminderPush } from "@/server/push/send";
import { isValidHostToken } from "@/server/host-auth";
import { RealtimeMessage } from "@/constants/realtime";
import { HOST_ONLY_MESSAGE_TYPES, HOST_TOKEN_HEADER } from "@/constants/host-auth";
import { PHASE_ORDER, PhaseControlMode, type EventPhase } from "@/constants/phases";
import type { ScoreEntry } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Clients publish here: the host POSTs a session snapshot (stored + fanned out)
 * or a one-off reminder; attendees POST their live score (aggregated into the
 * shared leaderboard the server fans back out via the SSE stream).
 */
export async function POST(request: Request) {
  // A score posted right after a restart must add to the persisted total, not
  // start a fresh one from zero.
  await ensureScoresHydrated();
  ensurePhaseClock();

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
    // The hub returns the player's new cumulative event total — persist that,
    // not the round score, so the roster and the live board always agree.
    const total = submitScore(body.entry);
    if (total !== null) {
      persistScore({ ...(body.entry as ScoreEntry), score: total });
    }
  } else if (body.type === RealtimeMessage.ClearScores) {
    clearAllScores();
    void purgeScores();
  } else if (body.type === RealtimeMessage.Phase) {
    // The host either pins a phase (Manual) or hands the journey back to the
    // programme clock (Auto — the server resolves which phase that is).
    const mode =
      body.mode === PhaseControlMode.Auto ? PhaseControlMode.Auto : PhaseControlMode.Manual;
    const phase = PHASE_ORDER.includes(body.phase) ? (body.phase as EventPhase) : undefined;
    if (mode === PhaseControlMode.Manual && !phase) {
      return Response.json({ ok: false, error: "invalid phase" }, { status: 400 });
    }
    const moved = setPhaseControl(mode, phase);
    // "What's next" phone notification for every attendee — fire-and-forget, and
    // only when the journey actually moved (a mode flip alone isn't news).
    if (moved) void sendPhasePush(moved).catch(() => {});
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
  void upsertTotalScore(db, entry).catch((error) => {
    console.error("score persist failed", error);
  });
}

/** Host wiped all game data — drop the persisted rows too. Irreversible. */
async function purgeScores(): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteAllScores(db).catch((error) => {
    console.error("score purge failed", error);
  });
}
