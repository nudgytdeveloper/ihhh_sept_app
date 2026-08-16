import { getDb } from "@/server/db";
import { importAttendance } from "@/server/db/attendees";
import { isValidHostToken } from "@/server/host-auth";
import { HOST_TOKEN_HEADER } from "@/constants/host-auth";
import { sanitizeAttendanceRows } from "@/utils/attendance";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * POST — load an attendance list (the IHH seed, or a CSV the host imported)
 * into the database. Upserts by email, so an attendee already registered keeps
 * their id, check-in stamp and score while taking the seat + role from the
 * list. Host-passcode protected.
 *
 * Seats already held by a *different* attendee come back in `skipped` instead
 * of being reassigned — the host resolves the clash in the console.
 */
export async function POST(request: Request) {
  if (!isValidHostToken(request.headers.get(HOST_TOKEN_HEADER))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const rows = sanitizeAttendanceRows((body as { rows?: unknown } | null)?.rows);
  if (!rows) {
    return Response.json({ ok: false, error: "invalid attendance rows" }, { status: 400 });
  }

  try {
    const outcome = await importAttendance(db, rows);
    return Response.json({ ok: true, ...outcome });
  } catch (error) {
    console.error("attendance import failed", error);
    return Response.json({ ok: false, error: "import failed" }, { status: 500 });
  }
}
