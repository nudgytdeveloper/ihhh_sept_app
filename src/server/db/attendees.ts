import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { attendees, gameScores, type AttendeeRow } from "./schema";
import type { Db } from "./index";
import type { LearningGoals, SeatInfo } from "@/types";

/** Server-side attendee store (registration + the Phase-2 roster reads). */

export interface AttendeeUpsert {
  /** The device's player id — used as the row id when it's a fresh, valid UUID. */
  playerId?: string;
  email: string;
  name: string;
  seat: SeatInfo | null;
  goals: LearningGoals;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Insert-or-update by email (the canonical identity). A new registration keeps
 * the device's player id as the row id when possible, so the attendee's
 * leaderboard/presence identity doesn't change mid-session; a returning email
 * updates name + goals but keeps the originally-allocated seat and id.
 */
export async function upsertAttendee(db: Db, input: AttendeeUpsert): Promise<AttendeeRow> {
  const useClientId = input.playerId !== undefined && UUID_PATTERN.test(input.playerId);
  const base = {
    email: input.email,
    name: input.name,
    seat: input.seat,
    goals: input.goals,
  };
  const values = useClientId ? { ...base, id: input.playerId } : base;
  const update = {
    name: input.name,
    goals: input.goals,
    // A returning attendee keeps their original seat; only fill it if missing.
    seat: sql`COALESCE(${attendees.seat}, excluded.seat)`,
  };

  try {
    const [row] = await db
      .insert(attendees)
      .values(values)
      .onConflictDoUpdate({ target: attendees.email, set: update })
      .returning();
    return row;
  } catch (error) {
    // The device id can collide with an existing row registered under another
    // email (e.g. storage cleared mid-event). Retry with a server-generated id.
    if (useClientId && isUniqueViolation(error)) {
      const [row] = await db
        .insert(attendees)
        .values(base)
        .onConflictDoUpdate({ target: attendees.email, set: update })
        .returning();
      return row;
    }
    throw error;
  }
}

/**
 * Stamp the attendee's first live connection (the attendance mark). No-op for
 * an already-checked-in attendee or a non-registered device id; memoized per
 * process so the SSE route doesn't re-issue the UPDATE on every reconnect.
 */
const stampedCheckIns = new Set<string>();

export async function markCheckedIn(db: Db, playerId: string): Promise<void> {
  if (!UUID_PATTERN.test(playerId) || stampedCheckIns.has(playerId)) return;
  stampedCheckIns.add(playerId);
  try {
    await db
      .update(attendees)
      .set({ checkedInAt: sql`now()` })
      .where(and(eq(attendees.id, playerId), isNull(attendees.checkedInAt)));
  } catch (error) {
    // Allow a retry on the next connection instead of losing the stamp.
    stampedCheckIns.delete(playerId);
    throw error;
  }
}

/** One attendee by id (device/player id = row id), or null. */
export async function getAttendeeById(db: Db, id: string): Promise<AttendeeRow | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [row] = await db.select().from(attendees).where(eq(attendees.id, id)).limit(1);
  return row ?? null;
}

/** One roster line: a registered attendee joined with their best game score. */
export interface RosterRecord {
  id: string;
  name: string;
  email: string;
  seat: SeatInfo | null;
  goals: LearningGoals;
  registeredAt: Date;
  checkedInAt: Date | null;
  score: number | null;
}

/**
 * Every registered attendee with their persisted best score (the Nov-event
 * roster / attendance list) — highest score first, then A–Z for the scoreless.
 */
export async function listRoster(db: Db): Promise<RosterRecord[]> {
  return db
    .select({
      id: attendees.id,
      name: attendees.name,
      email: attendees.email,
      seat: attendees.seat,
      goals: attendees.goals,
      registeredAt: attendees.createdAt,
      checkedInAt: attendees.checkedInAt,
      score: gameScores.score,
    })
    .from(attendees)
    .leftJoin(gameScores, sql`${attendees.id}::text = ${gameScores.playerId}`)
    .orderBy(desc(sql`COALESCE(${gameScores.score}, -1)`), asc(attendees.name));
}

/** Postgres unique violation (23505) — drizzle wraps the pg error as `cause`. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code =
    (error as { code?: string }).code ??
    ((error as { cause?: { code?: string } }).cause?.code);
  return code === "23505";
}
