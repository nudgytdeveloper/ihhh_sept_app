import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { upsertAttendee } from "@/server/db/attendees";
import { REGISTRATION_LIMITS } from "@/constants/registration";
import { isValidEmail, normalizeEmail, sanitizeLearningGoals } from "@/utils/registration";
import type { RegisteredAttendee, SeatInfo } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Register an attendee (welcome-gate submit). Upserts by corporate email — the
 * canonical identity — and returns the stored record, which the client adopts
 * (id + seat) so a returning attendee recovers their original identity on a new
 * device. Email is capture-only (validated for shape, never verified).
 *
 * With no `DATABASE_URL` configured the registration is still accepted and
 * echoed back unpersisted (`persisted: false`) so local dev without Postgres
 * keeps working — same graceful-fallback philosophy as `/api/voice`.
 */
export async function POST(request: Request) {
  let body: {
    playerId?: unknown;
    name?: unknown;
    email?: unknown;
    goals?: unknown;
    seat?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > REGISTRATION_LIMITS.nameMax) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }
  if (typeof body.email !== "string" || !isValidEmail(body.email)) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }
  const email = normalizeEmail(body.email);
  const goals = sanitizeLearningGoals(body.goals);
  if (!goals) {
    return NextResponse.json({ error: "Invalid goals" }, { status: 400 });
  }
  const seat =
    typeof body.seat === "object" && body.seat !== null ? (body.seat as SeatInfo) : null;
  const playerId = typeof body.playerId === "string" ? body.playerId : undefined;

  const db = getDb();
  if (!db) {
    const attendee: RegisteredAttendee = { id: playerId ?? "", name, email, seat, goals };
    return NextResponse.json({ attendee, persisted: false });
  }

  try {
    const row = await upsertAttendee(db, { playerId, email, name, seat, goals });
    const attendee: RegisteredAttendee = {
      id: row.id,
      name: row.name,
      email: row.email,
      seat: row.seat,
      goals: row.goals,
    };
    return NextResponse.json({ attendee, persisted: true });
  } catch (error) {
    console.error("[register] upsert failed:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
