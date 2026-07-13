import { Pool } from "pg";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

/**
 * Lazy, process-wide Postgres client (server-only). Returns `null` when
 * `DATABASE_URL` is unset so callers can degrade gracefully (same philosophy as
 * the voice route's 501 fallback) — local dev without a database still runs.
 *
 * Cached on `globalThis` so Next's dev hot-reload doesn't stack up pools.
 */

export type Db = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { __ihhhDb?: Db };

export function getDb(): Db | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!globalForDb.__ihhhDb) {
    const pool = new Pool({
      connectionString: url,
      max: 5,
      // Render's external Postgres URLs require TLS (self-signed chain).
      ssl: url.includes(".render.com") ? { rejectUnauthorized: false } : undefined,
    });
    globalForDb.__ihhhDb = drizzle(pool, { schema });
  }
  return globalForDb.__ihhhDb;
}
