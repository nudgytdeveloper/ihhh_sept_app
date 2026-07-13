/**
 * In-memory per-IP rate limits (Nov-event Phase 6 hardening). Applied only to the
 * *costly or abusable* routes — the paid AI providers, and one-off writes that
 * could be spammed. The cheap realtime score/publish path is deliberately NOT
 * rate-limited: at a real venue every attendee shares one NAT/public IP, so an
 * IP limit there would throttle legitimate players. Host actions are protected by
 * the passcode (see host-auth) instead.
 *
 * Single-instance (matches the in-memory hub); swap for a shared store (Redis)
 * if the Render service is ever scaled out. Limits are intentionally generous —
 * they stop runaway loops, not normal event traffic — and easy to tune here.
 */

/** A fixed-window limit: at most `limit` requests per `windowMs` per client. */
export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

/** Named buckets so each route's limit is explicit (no raw numbers at call sites). */
export enum RateLimitBucket {
  /** Personalized AI recaps → Google Gemini (real $ per call; cache-hit is free). */
  Summaries = "summaries",
  /** Speech-to-text → ElevenLabs Scribe (real $; only the host device records). */
  Transcribe = "transcribe",
  /** Attendee registration upserts. */
  Register = "register",
  /** Web Push subscription writes. */
  PushSubscribe = "push-subscribe",
  /** Host passcode checks — tight, to slow brute-forcing the control room. */
  HostVerify = "host-verify",
}

const MINUTE = 60_000;

export const RATE_LIMITS: Record<RateLimitBucket, RateLimitRule> = {
  [RateLimitBucket.Summaries]: { limit: 40, windowMs: MINUTE },
  [RateLimitBucket.Transcribe]: { limit: 120, windowMs: MINUTE },
  [RateLimitBucket.Register]: { limit: 60, windowMs: MINUTE },
  [RateLimitBucket.PushSubscribe]: { limit: 60, windowMs: MINUTE },
  [RateLimitBucket.HostVerify]: { limit: 10, windowMs: MINUTE },
};
