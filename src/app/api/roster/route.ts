import { getDb } from "@/server/db";
import { listRoster } from "@/server/db/attendees";
import { getOnlinePlayerIds } from "@/server/game-hub";
import type { RosterEntry, RosterResponse } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * The host roster: every registered attendee with their attendance mark
 * (`checkedInAt`, stamped on first live connection), persisted best game
 * score, and live online flag. Doubles as the Nov-event attendance list.
 */
export async function GET() {
  const db = getDb();
  if (!db) {
    return Response.json({ available: false, roster: [] } satisfies RosterResponse);
  }

  try {
    const records = await listRoster(db);
    const online = new Set(getOnlinePlayerIds());
    const roster: RosterEntry[] = records.map((record) => ({
      id: record.id,
      name: record.name,
      email: record.email,
      seat: record.seat,
      goals: record.goals,
      registeredAt: record.registeredAt.toISOString(),
      checkedInAt: record.checkedInAt?.toISOString() ?? null,
      score: record.score,
      online: online.has(record.id),
    }));
    return Response.json({ available: true, roster } satisfies RosterResponse);
  } catch (error) {
    console.error("roster fetch failed", error);
    return Response.json({ ok: false, error: "roster unavailable" }, { status: 500 });
  }
}
