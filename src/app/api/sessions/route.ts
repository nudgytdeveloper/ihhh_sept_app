import { getDb } from "@/server/db";
import { createSession, listSessions, toSession } from "@/server/db/sessions";
import { isValidSessionInput, sanitizeSpeaker, sanitizeTitle } from "@/utils/sessions";
import type { SessionListResponse } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET — the host's list of speaker sessions (newest first). */
export async function GET() {
  const db = getDb();
  if (!db) {
    return Response.json({ available: false, sessions: [] } satisfies SessionListResponse);
  }
  try {
    const rows = await listSessions(db);
    return Response.json({
      available: true,
      sessions: rows.map(toSession),
    } satisfies SessionListResponse);
  } catch (error) {
    console.error("sessions list failed", error);
    return Response.json({ ok: false, error: "sessions unavailable" }, { status: 500 });
  }
}

/** POST — create a session (needs a title + speaker). Persistence required. */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const body = await request.json().catch(() => null);
  const title = sanitizeTitle(typeof body?.title === "string" ? body.title : "");
  const speaker = sanitizeSpeaker(typeof body?.speaker === "string" ? body.speaker : "");
  if (!isValidSessionInput(title, speaker)) {
    return Response.json({ ok: false, error: "title and speaker are required" }, { status: 400 });
  }
  try {
    const row = await createSession(db, { title, speaker });
    return Response.json({ session: toSession(row) }, { status: 201 });
  } catch (error) {
    console.error("session create failed", error);
    return Response.json({ ok: false, error: "create failed" }, { status: 500 });
  }
}
