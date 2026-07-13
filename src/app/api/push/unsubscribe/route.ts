import { getDb } from "@/server/db";
import { deletePushSubscription } from "@/server/db/push-subscriptions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * An attendee turned phone alerts off (or the browser rotated the subscription):
 * drop the stored subscription by endpoint. Idempotent — unknown endpoints and a
 * missing database both succeed (nothing to remove).
 */
export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { endpoint?: unknown } | null;
  if (!body || typeof body.endpoint !== "string") {
    return Response.json({ ok: false, error: "missing endpoint" }, { status: 400 });
  }

  const db = getDb();
  if (db) await deletePushSubscription(db, body.endpoint);

  return Response.json({ ok: true });
}
