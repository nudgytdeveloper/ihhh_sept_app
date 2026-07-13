import { getDb } from "@/server/db";
import { deleteSession, getSession, toSession, updateSession } from "@/server/db/sessions";
import type { SessionPatch } from "@/server/db/sessions";
import {
  isSessionStatus,
  sanitizeSpeaker,
  sanitizeTitle,
  sanitizeTranscript,
} from "@/utils/sessions";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** GET — one session by id. */
export async function GET(_request: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const row = await getSession(db, id);
    if (!row) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    return Response.json({ session: toSession(row) });
  } catch (error) {
    console.error("session get failed", error);
    return Response.json({ ok: false, error: "session unavailable" }, { status: 500 });
  }
}

/**
 * PATCH — update mutable fields: recording status, the growing/edited
 * transcript, or a renamed title/speaker. Only provided (and valid) fields apply.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const patch: SessionPatch = {};
  if (typeof body.title === "string") patch.title = sanitizeTitle(body.title);
  if (typeof body.speaker === "string") patch.speaker = sanitizeSpeaker(body.speaker);
  if (typeof body.transcript === "string") patch.transcript = sanitizeTranscript(body.transcript);
  if (body.status !== undefined) {
    if (!isSessionStatus(body.status)) {
      return Response.json({ ok: false, error: "invalid status" }, { status: 400 });
    }
    patch.status = body.status;
  }
  if (Object.keys(patch).length === 0) {
    return Response.json({ ok: false, error: "nothing to update" }, { status: 400 });
  }

  try {
    const row = await updateSession(db, id, patch);
    if (!row) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    return Response.json({ session: toSession(row) });
  } catch (error) {
    console.error("session update failed", error);
    return Response.json({ ok: false, error: "update failed" }, { status: 500 });
  }
}

/** DELETE — remove a session. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const { id } = await params;
  try {
    const removed = await deleteSession(db, id);
    if (!removed) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("session delete failed", error);
    return Response.json({ ok: false, error: "delete failed" }, { status: 500 });
  }
}
