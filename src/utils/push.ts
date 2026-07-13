"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  NotificationPermissionState,
  PUSH_API_PATH,
  PUSH_SUBSCRIBE_PATH,
  PUSH_UNSUBSCRIBE_PATH,
  PushStatus,
  SERVICE_WORKER_PATH,
  SERVICE_WORKER_SCOPE,
} from "@/constants/push";
import type { PushConfigResponse } from "@/types";

/**
 * Client side of Web Push (Phase 5). Registers the service worker, walks the
 * attendee through the permission → subscribe flow, and persists the browser
 * `PushSubscription` to the server. Backed by a module-level store (like
 * `navi-voice`) so the header bell toggle and the home opt-in card share one
 * source of truth and stay in sync.
 */

/* ------------------------------- capability -------------------------------- */

/** Whether this browser can do Web Push at all (iOS needs "Add to Home Screen" first). */
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/* --------------------------------- the store ------------------------------- */

interface PushState {
  status: PushStatus;
  permission: NotificationPermissionState;
  busy: boolean;
  publicKey: string | null;
}

const SERVER_SNAPSHOT: PushState = {
  status: PushStatus.Unknown,
  permission: NotificationPermissionState.Default,
  busy: false,
  publicKey: null,
};

let state: PushState = { ...SERVER_SNAPSHOT };
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

function setState(patch: Partial<PushState>): void {
  state = { ...state, ...patch };
  emit();
}

function subscribeStore(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): PushState {
  return state;
}

function getServerSnapshot(): PushState {
  return SERVER_SNAPSHOT;
}

/* ---------------------------- service worker ------------------------------- */

let swRegistration: ServiceWorkerRegistration | null = null;

/** Register the push service worker once (safe to call on every mount). */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  if (swRegistration) return swRegistration;
  try {
    swRegistration = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
      scope: SERVICE_WORKER_SCOPE,
    });
    return swRegistration;
  } catch {
    return null;
  }
}

/* ------------------------------ VAPID helpers ------------------------------ */

/** Convert a base64url VAPID public key to the Uint8Array `subscribe` expects. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Back the view with a concrete ArrayBuffer so it satisfies BufferSource.
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

/** Fetch the server push config (configured flag + VAPID public key). */
async function fetchConfig(): Promise<PushConfigResponse> {
  const res = await fetch(PUSH_API_PATH, { cache: "no-store" });
  return (await res.json()) as PushConfigResponse;
}

async function postSubscription(
  sub: PushSubscription,
  attendeeId: string,
): Promise<boolean> {
  const res = await fetch(PUSH_SUBSCRIBE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...sub.toJSON(), attendeeId }),
  });
  return res.ok;
}

async function postUnsubscribe(endpoint: string): Promise<void> {
  await fetch(PUSH_UNSUBSCRIBE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  }).catch(() => {});
}

/* --------------------------------- actions --------------------------------- */

let refreshed = false;

/**
 * Resolve the current push state on mount: support, server config, notification
 * permission, and whether this device already has a live subscription. Runs once
 * per page load (idempotent) unless forced.
 */
export async function refreshPushState(force = false): Promise<void> {
  if (refreshed && !force) return;
  refreshed = true;

  if (!isPushSupported()) {
    setState({ status: PushStatus.Unsupported });
    return;
  }

  const permission = Notification.permission as NotificationPermissionState;

  let config: PushConfigResponse = { configured: false, publicKey: null };
  try {
    config = await fetchConfig();
  } catch {
    /* treat a config fetch failure as "not switched on" */
  }

  if (!config.configured || !config.publicKey) {
    setState({ status: PushStatus.Unconfigured, permission, publicKey: config.publicKey });
    return;
  }
  if (permission === NotificationPermissionState.Denied) {
    setState({ status: PushStatus.Blocked, permission, publicKey: config.publicKey });
    return;
  }

  const registration = await registerServiceWorker();
  const existing = registration ? await registration.pushManager.getSubscription() : null;
  setState({
    status: existing ? PushStatus.On : PushStatus.Off,
    permission,
    publicKey: config.publicKey,
  });
}

/**
 * Turn phone alerts on: ask permission, subscribe via the push service, and
 * persist the subscription for this attendee. Returns whether it succeeded.
 */
export async function enablePush(attendeeId: string): Promise<boolean> {
  if (!isPushSupported() || !attendeeId) return false;
  setState({ busy: true });
  try {
    const permission = (await Notification.requestPermission()) as NotificationPermissionState;
    setState({ permission });
    if (permission !== NotificationPermissionState.Granted) {
      setState({
        status:
          permission === NotificationPermissionState.Denied ? PushStatus.Blocked : PushStatus.Off,
        busy: false,
      });
      return false;
    }

    const publicKey = state.publicKey ?? (await fetchConfig()).publicKey;
    const registration = await registerServiceWorker();
    if (!publicKey || !registration) {
      setState({ status: publicKey ? PushStatus.Off : PushStatus.Unconfigured, busy: false });
      return false;
    }

    // Reuse an existing subscription (avoids an applicationServerKey clash) or make one.
    const sub =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      }));

    const ok = await postSubscription(sub, attendeeId);
    setState({ status: ok ? PushStatus.On : PushStatus.Off, busy: false });
    return ok;
  } catch {
    setState({ busy: false });
    return false;
  }
}

/** Turn phone alerts off: unsubscribe locally and drop the server-side record. */
export async function disablePush(): Promise<void> {
  setState({ busy: true });
  try {
    const registration = await registerServiceWorker();
    const sub = registration ? await registration.pushManager.getSubscription() : null;
    if (sub) {
      await postUnsubscribe(sub.endpoint);
      await sub.unsubscribe().catch(() => {});
    }
    setState({ status: PushStatus.Off, busy: false });
  } catch {
    setState({ busy: false });
  }
}

/* --------------------------------- the hook -------------------------------- */

export interface PushSubscriptionState {
  status: PushStatus;
  busy: boolean;
  /** Opt in (needs the attendee id to tie the subscription to a person). */
  enable: (attendeeId: string) => Promise<boolean>;
  /** Opt out. */
  disable: () => Promise<void>;
}

/**
 * React binding for the push opt-in. Shared module store, so the header toggle
 * and the home card reflect the same state and update together.
 */
export function usePushSubscription(): PushSubscriptionState {
  const snapshot = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void refreshPushState();
  }, []);

  return {
    status: snapshot.status,
    busy: snapshot.busy,
    enable: enablePush,
    disable: disablePush,
  };
}
