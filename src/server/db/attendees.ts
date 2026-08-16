import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { attendees, gameScores, type AttendeeRow } from "./schema";
import type { Db } from "./index";
import { DEFAULT_ATTENDEE_ROLE, type AttendeeRole } from "@/constants/seating";
import { EMPTY_LEARNING_GOALS } from "@/constants/registration";
import { nextFreeSeatId, normalizeSeatId } from "@/utils/seats";
import type { AttendanceImportRow, LearningGoals, SeatInfo } from "@/types";

/** Server-side attendee store: registration, seat placement, and roster reads. */

export interface AttendeeRegistration {
  /** The device's player id — used as the row id when it's a fresh, valid UUID. */
  playerId?: string;
  email: string;
  name: string;
  goals: LearningGoals;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** How many times a registration retries when it races another for a seat. */
const SEAT_RACE_RETRIES = 5;

/** The seat ids currently tagged to someone. */
export async function takenSeatIds(db: Db): Promise<string[]> {
  const rows = await db
    .select({ seatId: attendees.seatId })
    .from(attendees)
    .where(isNotNull(attendees.seatId));
  return rows.map((row) => row.seatId as string);
}

async function findByEmail(db: Db, email: string): Promise<AttendeeRow | null> {
  const [row] = await db
    .select()
    .from(attendees)
    .where(eq(attendees.email, email))
    .limit(1);
  return row ?? null;
}

/**
 * Register an attendee, resolving their seat.
 *
 * An email already on the attendance list (pre-loaded by the host, or from an
 * earlier registration) keeps the seat IHH designated for them — this is what
 * makes "check in and I'll take you to your seat" work. Anyone else is
 * auto-allocated the next free seat, which the host can override afterwards.
 * A full theatre leaves them unassigned rather than failing the registration.
 */
export async function registerAttendee(
  db: Db,
  input: AttendeeRegistration,
): Promise<AttendeeRow> {
  const existing = await findByEmail(db, input.email);

  if (existing) {
    const [updated] = await db
      .update(attendees)
      // `registeredAt` is only stamped the first time — it's what separates
      // "imported from the attendance list" from "has actually signed in".
      .set({
        name: input.name,
        goals: input.goals,
        registeredAt: existing.registeredAt ?? sql`now()`,
      })
      .where(eq(attendees.id, existing.id))
      .returning();
    // On the list but never placed (imported without a seat) — allocate now.
    return updated.seatId ? updated : allocateSeatFor(db, updated);
  }

  const useClientId = input.playerId !== undefined && UUID_PATTERN.test(input.playerId);

  for (let attempt = 0; attempt < SEAT_RACE_RETRIES; attempt++) {
    const seatId = nextFreeSeatId(await takenSeatIds(db));
    const base = {
      email: input.email,
      name: input.name,
      goals: input.goals,
      seatId,
      role: DEFAULT_ATTENDEE_ROLE,
      registeredAt: sql`now()`,
    };
    try {
      const [row] = await db
        .insert(attendees)
        .values(useClientId ? { ...base, id: input.playerId } : base)
        .returning();
      return row;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      // Another device took that seat (or this device id / email) between the
      // read and the insert — re-read and try again.
      const raced = await findByEmail(db, input.email);
      if (raced) return raced;
      if (useClientId && isConstraint(error, "attendees_pkey")) {
        // Device id collides with an existing row; let Postgres generate one.
        const [row] = await db.insert(attendees).values(base).returning();
        return row;
      }
    }
  }

  // Couldn't win a seat — register them unplaced so check-in still succeeds.
  const [row] = await db
    .insert(attendees)
    .values({
      email: input.email,
      name: input.name,
      goals: input.goals,
      role: DEFAULT_ATTENDEE_ROLE,
      registeredAt: sql`now()`,
    })
    .returning();
  return row;
}

/** Give an already-registered attendee the next free seat. */
async function allocateSeatFor(db: Db, row: AttendeeRow): Promise<AttendeeRow> {
  for (let attempt = 0; attempt < SEAT_RACE_RETRIES; attempt++) {
    const seatId = nextFreeSeatId(await takenSeatIds(db));
    if (!seatId) return row;
    try {
      const [updated] = await db
        .update(attendees)
        .set({ seatId })
        .where(eq(attendees.id, row.id))
        .returning();
      return updated;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
    }
  }
  return row;
}

/** Raised when the host tries to put two attendees in one seat. */
export class SeatTakenError extends Error {
  constructor(readonly seatId: string) {
    super(`Seat ${seatId} is already assigned`);
    this.name = "SeatTakenError";
  }
}

export interface AttendeePlacement {
  /** New seat id, or null to unassign. Omit to leave the seat unchanged. */
  seatId?: string | null;
  role?: AttendeeRole;
  name?: string;
}

/**
 * Host edit: move an attendee to a seat and/or re-tag their role. Throws
 * `SeatTakenError` rather than silently double-booking a seat.
 */
export async function updateAttendeePlacement(
  db: Db,
  id: string,
  placement: AttendeePlacement,
): Promise<AttendeeRow | null> {
  if (!UUID_PATTERN.test(id)) return null;

  const update: Partial<typeof attendees.$inferInsert> = {};
  if (placement.seatId !== undefined) {
    update.seatId = placement.seatId ? normalizeSeatId(placement.seatId) : null;
  }
  if (placement.role !== undefined) update.role = placement.role;
  if (placement.name !== undefined) update.name = placement.name;
  if (Object.keys(update).length === 0) return getAttendeeById(db, id);

  try {
    const [row] = await db
      .update(attendees)
      .set(update)
      .where(eq(attendees.id, id))
      .returning();
    return row ?? null;
  } catch (error) {
    if (isUniqueViolation(error) && update.seatId) {
      throw new SeatTakenError(update.seatId);
    }
    throw error;
  }
}

export interface ImportOutcome {
  imported: number;
  /** Rows whose seat clashed with someone already holding it. */
  skipped: string[];
}

/**
 * Load an attendance list (the IHH seed or a host CSV) into the database.
 * Upserts by email — an existing attendee keeps their id, check-in stamp and
 * score, and takes the seat + role from the imported row. A seat already held
 * by a *different* attendee is reported back rather than stolen.
 */
export async function importAttendance(
  db: Db,
  rows: readonly AttendanceImportRow[],
): Promise<ImportOutcome> {
  const skipped: string[] = [];
  let imported = 0;

  for (const row of rows) {
    const seatId = row.seatId ? normalizeSeatId(row.seatId) : null;
    if (seatId) {
      const [holder] = await db
        .select({ email: attendees.email })
        .from(attendees)
        .where(eq(attendees.seatId, seatId))
        .limit(1);
      if (holder && holder.email !== row.email) {
        skipped.push(`${row.email} → ${seatId} (held by ${holder.email})`);
        continue;
      }
    }

    try {
      await db
        .insert(attendees)
        .values({
          email: row.email,
          name: row.name,
          seatId,
          role: row.role,
          goals: EMPTY_LEARNING_GOALS,
        })
        .onConflictDoUpdate({
          target: attendees.email,
          set: { name: row.name, seatId, role: row.role },
        });
      imported++;
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      skipped.push(`${row.email} → ${seatId ?? "—"} (seat taken)`);
    }
  }

  return { imported, skipped };
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

/**
 * Is this email on the attendance list? The list is the access allowlist: only
 * people IHH imported (or who registered back when the list was still empty)
 * may enter the app. See `src/server/access.ts` for the policy around it.
 */
export async function isOnAttendanceList(db: Db, email: string): Promise<boolean> {
  const [row] = await db
    .select({ email: attendees.email })
    .from(attendees)
    .where(eq(attendees.email, email))
    .limit(1);
  return Boolean(row);
}

/** How many people are on the attendance list right now. */
export async function countAttendees(db: Db): Promise<number> {
  const [row] = await db.select({ total: sql<number>`count(*)::int` }).from(attendees);
  return row?.total ?? 0;
}

/** One attendee by id (device/player id = row id), or null. */
export async function getAttendeeById(db: Db, id: string): Promise<AttendeeRow | null> {
  if (!UUID_PATTERN.test(id)) return null;
  const [row] = await db.select().from(attendees).where(eq(attendees.id, id)).limit(1);
  return row ?? null;
}

/** One roster line: an attendee joined with their best game score. */
export interface RosterRecord {
  id: string;
  name: string;
  email: string;
  seatId: string | null;
  role: AttendeeRole;
  /** @deprecated legacy banquet seat, for rows predating the seat map. */
  legacySeat: SeatInfo | null;
  goals: LearningGoals;
  /** When the row appeared (attendance-list import or self-registration). */
  addedAt: Date;
  /** When they registered in the app — null = on the list but never signed in. */
  registeredAt: Date | null;
  checkedInAt: Date | null;
  score: number | null;
}

/**
 * Every attendee on the list with their persisted best score (the attendance
 * list) — highest score first, then A–Z for the scoreless.
 */
export async function listRoster(db: Db): Promise<RosterRecord[]> {
  return db
    .select({
      id: attendees.id,
      name: attendees.name,
      email: attendees.email,
      seatId: attendees.seatId,
      role: attendees.role,
      legacySeat: attendees.seat,
      goals: attendees.goals,
      addedAt: attendees.createdAt,
      registeredAt: attendees.registeredAt,
      checkedInAt: attendees.checkedInAt,
      score: gameScores.score,
    })
    .from(attendees)
    .leftJoin(gameScores, sql`${attendees.id}::text = ${gameScores.playerId}`)
    .orderBy(desc(sql`COALESCE(${gameScores.score}, -1)`), asc(attendees.name));
}

/** Postgres unique violation (23505) — drizzle wraps the pg error as `cause`. */
function isUniqueViolation(error: unknown): boolean {
  return pgField(error, "code") === "23505";
}

/** True when the violation came from a specific named constraint. */
function isConstraint(error: unknown, name: string): boolean {
  return pgField(error, "constraint") === name;
}

function pgField(error: unknown, field: "code" | "constraint"): string | undefined {
  if (typeof error !== "object" || error === null) return undefined;
  const direct = (error as Record<string, unknown>)[field];
  if (typeof direct === "string") return direct;
  const cause = (error as { cause?: Record<string, unknown> }).cause;
  const nested = cause?.[field];
  return typeof nested === "string" ? nested : undefined;
}
