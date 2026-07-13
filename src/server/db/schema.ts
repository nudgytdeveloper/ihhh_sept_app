import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { SessionStatus } from "@/constants/sessions";
import type { LearningGoals, SeatInfo } from "@/types";

/**
 * Drizzle schema for the Nov-event persistence layer (Postgres).
 *
 * Server-only (lives under `src/server`, same rule as `game-hub.ts`): the
 * client bundle must never import this. Tables are pushed with
 * `npm run db:push` (drizzle-kit) — see `drizzle.config.ts`.
 */

/**
 * One registered attendee, keyed by corporate email (the canonical identity —
 * re-registering with the same email on a new device recovers the record).
 * `checkedInAt` is stamped on the attendee's first live connection to the
 * event, making the roster double as the attendance list.
 */
export const attendees = pgTable("attendees", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  /** Auto-allocated seat, as shown at the welcome step. */
  seat: jsonb("seat").$type<SeatInfo>(),
  /** Learning goals picked/typed at registration — feeds the AI session summaries. */
  goals: jsonb("goals").$type<LearningGoals>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  /** First live connection at the event (null = registered but not yet attended). */
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
});

export type AttendeeRow = typeof attendees.$inferSelect;

/**
 * Best virus-game score per player, written through from the live score
 * publishes so the roster survives server restarts and round resets. Keyed by
 * the device playerId (equal to the attendee's row id once registered — kept
 * as text so a legacy non-UUID device id can still record a score).
 */
export const gameScores = pgTable("game_scores", {
  playerId: text("player_id").primaryKey(),
  /** Display handle at the time of the score (fallback when unregistered). */
  name: text("name").notNull(),
  score: integer("score").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type GameScoreRow = typeof gameScores.$inferSelect;

/**
 * One recorded speaker session (Nov-event Phase 3). The transcript is captured
 * live by ElevenLabs Scribe (one host device records) and grows one segment at
 * a time; `status` tracks the recording lifecycle. Later feeds the per-attendee
 * AI summaries keyed to each attendee's learning goals.
 */
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  speaker: text("speaker").notNull(),
  status: text("status").$type<SessionStatus>().notNull().default(SessionStatus.Scheduled),
  transcript: text("transcript").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type SessionRow = typeof sessions.$inferSelect;

/**
 * A personalized AI recap of one session for one attendee (Phase 4), keyed to
 * that attendee's learning goals. One per (session × attendee); regenerating
 * overwrites the row, editing sets `edited`. Deleting a session cascades here.
 */
export const summaries = pgTable(
  "summaries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => sessions.id, { onDelete: "cascade" }),
    /** The attendee (device/player id = attendees.id) the recap is tailored for. */
    attendeeId: text("attendee_id").notNull(),
    content: text("content").notNull(),
    /** True once the attendee has edited the AI-generated text. */
    edited: boolean("edited").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("summaries_session_attendee_uq").on(table.sessionId, table.attendeeId)],
);

export type SummaryRow = typeof summaries.$inferSelect;

/**
 * A Web Push subscription for one attendee device (Nov-event Phase 5). Keyed by
 * the push service `endpoint` (unique per device+browser); `p256dh` + `auth` are
 * the client keys the server encrypts payloads to. One attendee can hold several
 * (multiple devices/browsers). Stale rows are pruned when the push service
 * replies 404/410 (see `src/server/push/send.ts`).
 */
export const pushSubscriptions = pgTable("push_subscriptions", {
  endpoint: text("endpoint").primaryKey(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  /** The attendee (device/player id = attendees.id) this subscription belongs to. */
  attendeeId: text("attendee_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type PushSubscriptionRow = typeof pushSubscriptions.$inferSelect;
