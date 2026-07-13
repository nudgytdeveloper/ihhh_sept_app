import { sql } from "drizzle-orm";
import { getDb } from "@/server/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Health check (Phase 6) — Render's `healthCheckPath`. Always 200 when the web
 * service is up (the app degrades gracefully without a database), with the DB
 * reachability reported as a field rather than failing the check, so a transient
 * DB blip doesn't take the whole service out of rotation.
 */
export async function GET() {
  const db = getDb();
  let database: "ok" | "unreachable" | "unset" = "unset";
  if (db) {
    try {
      await db.execute(sql`select 1`);
      database = "ok";
    } catch {
      database = "unreachable";
    }
  }
  return Response.json({ status: "ok", database, time: new Date().toISOString() });
}
