import { getDb } from "@/server/db";
import {
  SeatTakenError,
  getAttendeeById,
  updateAttendeePlacement,
  type AttendeePlacement,
} from "@/server/db/attendees";
import { isValidHostToken } from "@/server/host-auth";
import { HOST_TOKEN_HEADER } from "@/constants/host-auth";
import { REGISTRATION_LIMITS } from "@/constants/registration";
import { isAttendeeRole } from "@/utils/attendance";
import { isAssignableSeatId, seatInfoFor } from "@/utils/seats";
import type { RosterEntry } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET — one attendee's current placement. The attendee's own device calls this
 * with its player id so the seat map reflects a host re-assignment without
 * re-registering; it returns only that person's seat/role/name, never the list.
 * No passcode: knowing the UUID is knowing your own record.
 */
export async function GET(_request: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }

  const { id } = await params;
  try {
    const row = await getAttendeeById(db, id);
    if (!row) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    return Response.json({
      ok: true,
      attendee: {
        id: row.id,
        name: row.name,
        seat: row.seatId ? seatInfoFor(row.seatId) : row.seat,
        role: row.role,
      },
    });
  } catch (error) {
    console.error("attendee lookup failed", error);
    return Response.json({ ok: false, error: "lookup failed" }, { status: 500 });
  }
}

/**
 * PATCH — the host tags an attendee to a seat and/or a role (Staff /
 * Supervisor / HOD / Guest) from the roster console. Host-passcode protected,
 * like every other action that changes what attendees see.
 *
 * `seatId: null` unassigns. A seat already held by someone else comes back as
 * 409 rather than double-booking it.
 */
export async function PATCH(request: Request, { params }: Ctx) {
  if (!isValidHostToken(request.headers.get(HOST_TOKEN_HEADER))) {
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ ok: false, error: "invalid body" }, { status: 400 });
  }

  const placement: AttendeePlacement = {};

  if ("seatId" in body) {
    const raw = (body as { seatId: unknown }).seatId;
    if (raw === null || raw === "") {
      placement.seatId = null;
    } else if (typeof raw === "string" && isAssignableSeatId(raw)) {
      placement.seatId = raw;
    } else {
      return Response.json({ ok: false, error: "invalid seat" }, { status: 400 });
    }
  }

  if ("role" in body) {
    const raw = (body as { role: unknown }).role;
    if (typeof raw !== "string" || !isAttendeeRole(raw)) {
      return Response.json({ ok: false, error: "invalid role" }, { status: 400 });
    }
    placement.role = raw;
  }

  if ("name" in body) {
    const raw = (body as { name: unknown }).name;
    if (typeof raw !== "string" || !raw.trim() || raw.length > REGISTRATION_LIMITS.nameMax) {
      return Response.json({ ok: false, error: "invalid name" }, { status: 400 });
    }
    placement.name = raw.trim();
  }

  try {
    const row = await updateAttendeePlacement(db, id, placement);
    if (!row) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    const attendee: Pick<RosterEntry, "id" | "name" | "email" | "seat" | "role"> = {
      id: row.id,
      name: row.name,
      email: row.email,
      seat: row.seatId ? seatInfoFor(row.seatId) : row.seat,
      role: row.role,
    };
    return Response.json({ ok: true, attendee });
  } catch (error) {
    if (error instanceof SeatTakenError) {
      return Response.json(
        { ok: false, error: `Seat ${error.seatId} is already assigned` },
        { status: 409 },
      );
    }
    console.error("attendee placement failed", error);
    return Response.json({ ok: false, error: "update failed" }, { status: 500 });
  }
}
