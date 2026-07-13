import { sql } from "drizzle-orm";
import { gameScores } from "./schema";
import type { Db } from "./index";
import type { ScoreEntry } from "@/types";

/**
 * Persistent virus-game scores (server-only). Written through from the live
 * score publishes so the roster's scores survive server restarts and round
 * resets — the row keeps each player's BEST score across the whole event,
 * while the in-memory hub board stays the live per-round view.
 */

export async function upsertBestScore(db: Db, entry: ScoreEntry): Promise<void> {
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
