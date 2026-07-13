import { and, desc, eq, sql } from "drizzle-orm";
import { summaries, type SummaryRow } from "./schema";
import type { Db } from "./index";
import type { Summary } from "@/types";

/**
 * Server-side store for personalized AI session summaries (Phase 4): fetch the
 * cached summary for a (session × attendee), upsert a freshly-generated one, and
 * apply attendee edits.
 */

/** Map a DB row to the client-facing Summary DTO (Date → ISO string). */
export function toSummary(row: SummaryRow): Summary {
  return {
    id: row.id,
    sessionId: row.sessionId,
    attendeeId: row.attendeeId,
    content: row.content,
    edited: row.edited,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The cached summary for this session + attendee, or null. */
export async function getSummary(
  db: Db,
  sessionId: string,
  attendeeId: string,
): Promise<SummaryRow | null> {
  const [row] = await db
    .select()
    .from(summaries)
    .where(and(eq(summaries.sessionId, sessionId), eq(summaries.attendeeId, attendeeId)))
    .limit(1);
  return row ?? null;
}

/** Every summary this attendee has generated (newest first) — hydrates recaps. */
export async function listSummariesForAttendee(
  db: Db,
  attendeeId: string,
): Promise<SummaryRow[]> {
  return db
    .select()
    .from(summaries)
    .where(eq(summaries.attendeeId, attendeeId))
    .orderBy(desc(summaries.updatedAt));
}

export async function getSummaryById(db: Db, id: string): Promise<SummaryRow | null> {
  const [row] = await db.select().from(summaries).where(eq(summaries.id, id)).limit(1);
  return row ?? null;
}

/**
 * Store a freshly-generated summary, overwriting any existing one for this
 * (session × attendee) — a regenerate resets `edited` and bumps `updatedAt`.
 */
export async function upsertSummary(
  db: Db,
  input: { sessionId: string; attendeeId: string; content: string },
): Promise<SummaryRow> {
  const [row] = await db
    .insert(summaries)
    .values({
      sessionId: input.sessionId,
      attendeeId: input.attendeeId,
      content: input.content,
    })
    .onConflictDoUpdate({
      target: [summaries.sessionId, summaries.attendeeId],
      set: { content: input.content, edited: false, updatedAt: sql`now()` },
    })
    .returning();
  return row;
}

/** Apply an attendee edit to a summary (marks it edited). */
export async function updateSummaryContent(
  db: Db,
  id: string,
  content: string,
): Promise<SummaryRow | null> {
  const [row] = await db
    .update(summaries)
    .set({ content, edited: true, updatedAt: sql`now()` })
    .where(eq(summaries.id, id))
    .returning();
  return row ?? null;
}
