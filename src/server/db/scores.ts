import { sql } from "drizzle-orm";
import { gameScores } from "./schema";
import type { Db } from "./index";
import type { ScoreEntry } from "@/types";

/**
 * Persistent virus-game scores (server-only). Written through from the live
 * score publishes so the roster survives server restarts and round resets.
 *
 * The row holds the player's CUMULATIVE event total — every round they play
 * adds to it — which the hub computes and passes in. `GREATEST` is kept as a
 * safety net: a total only ever grows, so a lower value can only come from a
 * stale or out-of-order write and must never downgrade the stored one.
 */
export async function upsertTotalScore(db: Db, entry: ScoreEntry): Promise<void> {
  await db
    .insert(gameScores)
    .values({ playerId: entry.playerId, name: entry.name, score: entry.score })
    .onConflictDoUpdate({
      target: gameScores.playerId,
      set: {
        score: sql`GREATEST(${gameScores.score}, excluded.score)`,
        name: sql`excluded.name`,
        updatedAt: sql`now()`,
      },
    });
}

/** Every persisted total — used to seed the hub's in-memory totals at boot. */
export async function listAllScores(db: Db): Promise<ScoreEntry[]> {
  const rows = await db
    .select({
      playerId: gameScores.playerId,
      name: gameScores.name,
      score: gameScores.score,
    })
    .from(gameScores);
  return rows.map((row) => ({
    playerId: row.playerId,
    name: row.name ?? "",
    score: row.score ?? 0,
  }));
}

/** Host wiped all game data — drop every persisted score. Irreversible. */
export async function deleteAllScores(db: Db): Promise<void> {
  await db.delete(gameScores);
}
