"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  HOST_TOKEN_STORAGE_KEY,
  HOST_VERIFY_PATH,
  HostAuthStatus,
} from "@/constants/host-auth";

/**
 * Client side of the host control-room passcode (Phase 6). Backed by a
 * module-level store (like `navi-voice` / `push`) so the gate and any header
 * control stay in sync. `getStoredHostToken()` is read by the realtime transport
 * to attach the passcode to host publish requests.
 */

/* --------------------------- persisted host token -------------------------- */

let tokenCache: string | null | undefined; // undefined = not read yet

/** The verified passcode stored on this device (null if none). */
export function getStoredHostToken(): string | null {
  if (tokenCache !== undefined) return tokenCache;
  if (typeof window === "undefined") return null;
  try {
    tokenCache = window.localStorage.getItem(HOST_TOKEN_STORAGE_KEY);
  } catch {
    tokenCache = null;
  }
  return tokenCache;
}

function persistToken(token: string | null): void {
  tokenCache = token;
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(HOST_TOKEN_STORAGE_KEY, token);
    else window.localStorage.removeItem(HOST_TOKEN_STORAGE_KEY);
  } catch {
    /* storage unavailable — token stays in memory for this session */
  }
}

/* -------------------------------- the store -------------------------------- */

let status: HostAuthStatus = HostAuthStatus.Unknown;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}
function setStatus(next: HostAuthStatus): void {
  if (status === next) return;
  status = next;
  emit();
}
function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
function getSnapshot(): HostAuthStatus {
  return status;
}
function getServerSnapshot(): HostAuthStatus {
  return HostAuthStatus.Unknown;
}

/* --------------------------------- actions --------------------------------- */

/** POST a token to the verify endpoint; returns whether it's accepted. */
async function verify(token: string): Promise<boolean> {
  try {
    const res = await fetch(HOST_VERIFY_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = (await res.json()) as { ok?: boolean };
    return Boolean(data.ok);
  } catch {
    return false;
  }
}

let refreshed = false;

/**
 * Resolve the control-room state on mount: is a passcode required, and if so does
 * this device already hold a valid one? Runs once per load unless forced.
 */
export async function refreshHostAuth(force = false): Promise<void> {
  if (refreshed && !force) return;
  refreshed = true;
  try {
    const res = await fetch(HOST_VERIFY_PATH, { cache: "no-store" });
    const { required } = (await res.json()) as { required: boolean };
    if (!required) {
      setStatus(HostAuthStatus.Open);
      return;
    }
    const existing = getStoredHostToken();
    if (existing && (await verify(existing))) {
      setStatus(HostAuthStatus.Unlocked);
    } else {
      if (existing) persistToken(null); // stale/rotated passcode — drop it
      setStatus(HostAuthStatus.Locked);
    }
  } catch {
    // Can't reach the server — treat as locked so we don't imply access.
    setStatus(HostAuthStatus.Locked);
  }
}

/** Try to unlock with a passcode; on success it's stored + used for host requests. */
export async function unlockHost(token: string): Promise<boolean> {
  const trimmed = token.trim();
  if (!trimmed) return false;
  const ok = await verify(trimmed);
  if (ok) {
    persistToken(trimmed);
    setStatus(HostAuthStatus.Unlocked);
  }
  return ok;
}

/** Forget the passcode on this device (re-locks the control room). */
export function lockHost(): void {
  persistToken(null);
  setStatus(HostAuthStatus.Locked);
}

/* --------------------------------- the hook -------------------------------- */

export interface HostAuth {
  status: HostAuthStatus;
  /** Attempt to unlock with a passcode. */
  unlock: (token: string) => Promise<boolean>;
  /** Re-lock (forget the stored passcode). */
  lock: () => void;
}

/** React binding for the host control-room gate. */
export function useHostAuth(): HostAuth {
  const current = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void refreshHostAuth();
  }, []);

  const unlock = useCallback((token: string) => unlockHost(token), []);
  const lock = useCallback(() => lockHost(), []);

  return { status: current, unlock, lock };
}
