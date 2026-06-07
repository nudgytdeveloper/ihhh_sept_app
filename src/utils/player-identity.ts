"use client";

import { useSyncExternalStore } from "react";
import {
  PLAYER_NAME_ADJECTIVES,
  PLAYER_NAME_ANIMALS,
  PLAYER_NAME_FALLBACK,
  PLAYER_STORAGE_KEYS,
} from "@/constants/player";

/**
 * Per-device player identity for the shared live leaderboard.
 *
 * Each browser gets a stable random id + a friendly auto-generated handle
 * (e.g. "Swift Otter"), persisted to localStorage so it survives reloads and
 * stays distinct across attendees' phones. Bound to components via
 * `usePlayerIdentity()` (useSyncExternalStore → SSR-safe, no hydration mismatch,
 * no set-state-in-effect).
 */

export interface PlayerIdentity {
  id: string;
  name: string;
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

function generateName(): string {
  return `${pick(PLAYER_NAME_ADJECTIVES)} ${pick(PLAYER_NAME_ANIMALS)}`;
}

/**
 * The stable identity for this device, creating + persisting one on first use.
 * Returns empty fields on the server (no localStorage) — call from the client.
 */
export function getPlayerIdentity(): PlayerIdentity {
  if (typeof window === "undefined") return { id: "", name: "" };

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

  return { id, name };
}

/* ------- React binding: a stable, SSR-safe identity for components ------- */

/** SSR / pre-hydration snapshot — id is empty (the "not ready yet" signal). */
const SERVER_IDENTITY: PlayerIdentity = { id: "", name: PLAYER_NAME_FALLBACK };
/** Cached so getSnapshot returns a stable reference (required by the store). */
let cached: PlayerIdentity | null = null;

function getSnapshot(): PlayerIdentity {
  if (!cached) cached = getPlayerIdentity();
  return cached;
}

function getServerSnapshot(): PlayerIdentity {
  return SERVER_IDENTITY;
}

function subscribe(): () => void {
  // Identity is fixed once loaded — nothing to subscribe to.
  return () => {};
}

/**
 * The per-device identity for the current client. Renders the SSR placeholder
 * during hydration, then the real persisted identity — `identity.id === ""`
 * means "not loaded yet".
 */
export function usePlayerIdentity(): PlayerIdentity {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
