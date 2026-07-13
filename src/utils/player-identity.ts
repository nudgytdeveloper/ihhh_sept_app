"use client";

import { useSyncExternalStore } from "react";
import {
  ONBOARDED_FLAG,
  PLAYER_NAME_ADJECTIVES,
  PLAYER_NAME_ANIMALS,
  PLAYER_NAME_FALLBACK,
  PLAYER_STORAGE_KEYS,
  SEAT_SEATS_PER_TABLE,
  SEAT_TABLE_COUNT,
  SEAT_ZONES,
} from "@/constants/player";
import { EMPTY_LEARNING_GOALS, REGISTER_API_PATH } from "@/constants/registration";
import { RegistrationStatus, SeatStatus } from "@/constants/statuses";
import { getInitials } from "@/utils/format";
import { normalizeEmail } from "@/utils/registration";
import type { Attendee, LearningGoals, RegisteredAttendee, SeatInfo } from "@/types";

/**
 * Per-device attendee identity for the Event Navigator.
 *
 * Each browser gets a stable random id, an auto-allocated seat, and a display
 * name — auto handle (e.g. "Swift Otter") until the welcome step, then the
 * attendee's entered name. Persisted to localStorage so it survives reloads and
 * stays distinct across phones. The same identity feeds the navigator persona
 * (name + seat on the home/schedule/status cards) and the shared leaderboard.
 *
 * Bound to components via `usePlayerIdentity()` (useSyncExternalStore → SSR-safe,
 * no hydration mismatch). `completeRegistration()` updates it reactively.
 */

export interface PlayerIdentity {
  id: string;
  /** Display name: the attendee's entered name, or an auto handle until set. */
  name: string;
  /** Auto-allocated seat (assigned on first visit). */
  seat: SeatInfo;
  /** True once the attendee has completed the welcome (registered). */
  onboarded: boolean;
  /** Corporate email entered at registration ("" until registered). */
  email: string;
  /** Learning goals set at registration (empty until registered). */
  goals: LearningGoals;
}

/** What the welcome gate submits to register this attendee. */
export interface RegistrationDetails {
  name: string;
  email: string;
  goals: LearningGoals;
}

function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode / blocked) — identity is per-session */
  }
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `p_${Math.random().toString(36).slice(2)}${Math.random().toString(36).slice(2)}`;
}

function pick(list: readonly string[]): string {
  return list[Math.floor(Math.random() * list.length)];
}

function randomInt(max: number): number {
  return 1 + Math.floor(Math.random() * max);
}

function generateName(): string {
  return `${pick(PLAYER_NAME_ADJECTIVES)} ${pick(PLAYER_NAME_ANIMALS)}`;
}

/** A fresh, automatically-allocated seat. */
function allocateSeat(): SeatInfo {
  return {
    status: SeatStatus.Ready,
    zone: pick(SEAT_ZONES),
    table: `Table ${randomInt(SEAT_TABLE_COUNT)}`,
    seat: `Seat ${randomInt(SEAT_SEATS_PER_TABLE)}`,
  };
}

function readSeat(): SeatInfo {
  const raw = readStored(PLAYER_STORAGE_KEYS.seat);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as SeatInfo;
      if (parsed && parsed.table && parsed.seat) return parsed;
    } catch {
      /* fall through to a fresh allocation */
    }
  }
  const seat = allocateSeat();
  writeStored(PLAYER_STORAGE_KEYS.seat, JSON.stringify(seat));
  return seat;
}

/** SSR placeholder seat (no localStorage on the server). */
const PLACEHOLDER_SEAT: SeatInfo = { status: SeatStatus.Unassigned };

/**
 * The stable identity for this device, creating + persisting one on first use.
 * Returns the SSR placeholder (empty id) on the server — call from the client.
 */
export function getPlayerIdentity(): PlayerIdentity {
  if (typeof window === "undefined") {
    return {
      id: "",
      name: PLAYER_NAME_FALLBACK,
      seat: PLACEHOLDER_SEAT,
      onboarded: false,
      email: "",
      goals: EMPTY_LEARNING_GOALS,
    };
  }

  let id = readStored(PLAYER_STORAGE_KEYS.id);
  if (!id) {
    id = randomId();
    writeStored(PLAYER_STORAGE_KEYS.id, id);
  }

  let name = readStored(PLAYER_STORAGE_KEYS.name);
  if (!name) {
    name = generateName();
    writeStored(PLAYER_STORAGE_KEYS.name, name);
  }

  const seat = readSeat();
  const onboarded = readStored(PLAYER_STORAGE_KEYS.onboarded) === ONBOARDED_FLAG;
  const email = readStored(PLAYER_STORAGE_KEYS.email) ?? "";
  const goals = readGoals();

  return { id, name, seat, onboarded, email, goals };
}

function readGoals(): LearningGoals {
  const raw = readStored(PLAYER_STORAGE_KEYS.goals);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as LearningGoals;
      if (parsed && Array.isArray(parsed.selected)) return parsed;
    } catch {
      /* fall through to the empty value */
    }
  }
  return EMPTY_LEARNING_GOALS;
}

/** Build the attendee persona (name, initials, seat, check-in) from an identity. */
export function attendeeFromIdentity(identity: PlayerIdentity): Attendee {
  return {
    id: identity.id || "att_self",
    name: identity.name,
    initials: getInitials(identity.name),
    registration: identity.onboarded
      ? RegistrationStatus.Complete
      : RegistrationStatus.Incomplete,
    seat: identity.seat,
  };
}

/* ------- React binding: a stable, SSR-safe identity store for components ------ */

/** SSR / pre-hydration snapshot — id is empty (the "not ready yet" signal). */
const SERVER_IDENTITY: PlayerIdentity = {
  id: "",
  name: PLAYER_NAME_FALLBACK,
  seat: PLACEHOLDER_SEAT,
  onboarded: false,
  email: "",
  goals: EMPTY_LEARNING_GOALS,
};
/** Cached so getSnapshot returns a stable reference (required by the store). */
let cached: PlayerIdentity | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): PlayerIdentity {
  if (!cached) cached = getPlayerIdentity();
  return cached;
}

function getServerSnapshot(): PlayerIdentity {
  return SERVER_IDENTITY;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(): void {
  listeners.forEach((listener) => listener());
}

/**
 * Register the attendee and finish onboarding. Posts the details to
 * `/api/register` (which upserts by email — the canonical identity), then adopts
 * the server's record: a returning attendee re-registering on a new device gets
 * their original id + seat back, so their score history and presence follow
 * them. Persists everything + the onboarded flag and notifies subscribers so
 * the welcome gate gives way to the navigator.
 *
 * Throws on a failed request (server unreachable / rejected) — the gate shows
 * the error and lets the attendee retry. When the server has no database
 * configured it still accepts the registration (unpersisted local-dev mode).
 */
export async function completeRegistration(details: RegistrationDetails): Promise<void> {
  if (typeof window === "undefined") return;
  const current = getSnapshot();
  const name = details.name.trim() || current.name;
  const email = normalizeEmail(details.email);

  const response = await fetch(REGISTER_API_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: current.id,
      name,
      email,
      goals: details.goals,
      seat: current.seat,
    }),
  });
  if (!response.ok) {
    throw new Error(`Registration failed (${response.status})`);
  }
  const { attendee } = (await response.json()) as { attendee: RegisteredAttendee };

  const id = attendee.id || current.id;
  const seat = attendee.seat ?? current.seat;
  writeStored(PLAYER_STORAGE_KEYS.id, id);
  writeStored(PLAYER_STORAGE_KEYS.name, attendee.name || name);
  writeStored(PLAYER_STORAGE_KEYS.seat, JSON.stringify(seat));
  writeStored(PLAYER_STORAGE_KEYS.email, attendee.email || email);
  writeStored(PLAYER_STORAGE_KEYS.goals, JSON.stringify(attendee.goals));
  writeStored(PLAYER_STORAGE_KEYS.onboarded, ONBOARDED_FLAG);
  cached = {
    id,
    name: attendee.name || name,
    seat,
    onboarded: true,
    email: attendee.email || email,
    goals: attendee.goals,
  };
  emit();
}

/**
 * The per-device identity for the current client. Renders the SSR placeholder
 * during hydration, then the real persisted identity — `identity.id === ""`
 * means "not loaded yet".
 */
export function usePlayerIdentity(): PlayerIdentity {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
