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
import { RegistrationStatus, SeatStatus } from "@/constants/statuses";
import { getInitials } from "@/utils/format";
import type { Attendee, SeatInfo } from "@/types";

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
 * no hydration mismatch). `completeOnboarding()` updates it reactively.
 */

export interface PlayerIdentity {
  id: string;
  /** Display name: the attendee's entered name, or an auto handle until set. */
  name: string;
  /** Auto-allocated seat (assigned on first visit). */
  seat: SeatInfo;
  /** True once the attendee has completed the welcome (entered their name). */
  onboarded: boolean;
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
    return { id: "", name: PLAYER_NAME_FALLBACK, seat: PLACEHOLDER_SEAT, onboarded: false };
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

  return { id, name, seat, onboarded };
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
 * Finish onboarding: persist the attendee's entered name + the onboarded flag and
 * notify subscribers so the welcome gate gives way to the navigator. A blank name
 * keeps the existing auto handle.
 */
export function completeOnboarding(name: string): void {
  if (typeof window === "undefined") return;
  const current = getSnapshot();
  const finalName = name.trim() || current.name;
  writeStored(PLAYER_STORAGE_KEYS.name, finalName);
  writeStored(PLAYER_STORAGE_KEYS.onboarded, ONBOARDED_FLAG);
  cached = { ...current, name: finalName, onboarded: true };
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
