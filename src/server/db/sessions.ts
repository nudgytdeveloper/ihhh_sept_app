import { desc, eq, sql } from "drizzle-orm";
import { sessions, type SessionRow } from "./schema";
import type { Db } from "./index";
import type { SessionStatus } from "@/constants/sessions";
import type { Session } from "@/types";

/**
 * Server-side speaker-session store (Phase 3): create sessions, list them for
 * the host, and update the transcript/status as recording progresses.
 */

/** Map a DB row to the client-facing Session DTO (Date → ISO string). */
export function toSession(row: SessionRow): Session {
  return {
    id: row.id,
    title: row.title,
    speaker: row.speaker,
    status: row.status,
    transcript: row.transcript,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export interface SessionCreate {
  title: string;
  speaker: string;
}

export async function createSession(db: Db, input: SessionCreate): Promise<SessionRow> {
  const [row] = await db
    .insert(sessions)
    .values({ title: input.title, speaker: input.speaker })
    .returning();
  return row;
}

/** All sessions, newest first (the host list). */
export async function listSessions(db: Db): Promise<SessionRow[]> {
  return db.select().from(sessions).orderBy(desc(sessions.createdAt));
}

export async function getSession(db: Db, id: string): Promise<SessionRow | null> {
  const [row] = await db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
  return row ?? null;
}

/** Fields the host can update on a session (all optional — only set ones apply). */
export interface SessionPatch {
  title?: string;
  speaker?: string;
  status?: SessionStatus;
  transcript?: string;
}

/**
 * Update a session's mutable fields (recording status, growing/edited
 * transcript, renamed title/speaker) and bump `updatedAt`. Returns the updated
 * row, or null if no such id.
 */
export async function updateSession(
  db: Db,
  id: string,
  patch: SessionPatch,
): Promise<SessionRow | null> {
  const set: Record<string, unknown> = { updatedAt: sql`now()` };
  if (patch.title !== undefined) set.title = patch.title;
  if (patch.speaker !== undefined) set.speaker = patch.speaker;
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.transcript !== undefined) set.transcript = patch.transcript;

  const [row] = await db.update(sessions).set(set).where(eq(sessions.id, id)).returning();
  return row ?? null;
}

/** Delete a session. Returns whether a row was removed. */
export async function deleteSession(db: Db, id: string): Promise<boolean> {
  const rows = await db.delete(sessions).where(eq(sessions.id, id)).returning({ id: sessions.id });
  return rows.length > 0;
}
