import { sql } from "drizzle-orm";
import { attendees, type AttendeeRow } from "./schema";
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

/** Postgres unique violation (23505) — drizzle wraps the pg error as `cause`. */
function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) return false;
  const code =
    (error as { code?: string }).code ??
    ((error as { cause?: { code?: string } }).cause?.code);
  return code === "23505";
}
