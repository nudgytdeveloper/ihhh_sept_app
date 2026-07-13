import { timingSafeEqual } from "node:crypto";

/**
 * Host control-room passcode check (server-only, Phase 6). Validates a presented
 * token against the server-only `HOST_TOKEN`. When `HOST_TOKEN` is unset the
 * control room is OPEN (local dev / trusted demo) — set it in production to lock
 * the host down. Never imported by client code.
 */

const hostToken = process.env.HOST_TOKEN;

/** Whether a passcode is configured (i.e. the control room is protected). */
export function isHostAuthRequired(): boolean {
  return Boolean(hostToken && hostToken.length > 0);
}

/**
 * Whether `presented` is authorized to perform host actions. Constant-time
 * compare when a token is configured; open (always true) when it isn't.
 */
export function isValidHostToken(presented: string | null | undefined): boolean {
  if (!hostToken) return true; // not configured → open
  if (!presented) return false;
  const a = Buffer.from(presented);
  const b = Buffer.from(hostToken);
  // timingSafeEqual throws on length mismatch — guard first (length isn't secret).
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
