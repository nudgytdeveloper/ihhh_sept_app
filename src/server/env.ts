/**
 * Startup environment validation (server-only, Phase 6). Logged once at boot via
 * `instrumentation.ts` so an operator can see — in the Render logs — exactly
 * which capabilities are switched on and which optional integrations are off,
 * without any secret values ever being printed. Nothing here throws: every
 * feature degrades gracefully when its env is unset (that's the app's contract).
 */

interface EnvSummary {
  /** Capabilities that are off because their env is missing (informational). */
  disabled: string[];
  /** Warnings an operator should notice (e.g. an open control room in prod). */
  warnings: string[];
}

function has(name: string): boolean {
  return Boolean(process.env[name] && process.env[name]!.length > 0);
}

export function summarizeEnv(): EnvSummary {
  const disabled: string[] = [];
  const warnings: string[] = [];
  const isProd = process.env.NODE_ENV === "production";

  if (!has("DATABASE_URL")) {
    disabled.push("Postgres persistence (registration/roster/sessions/recaps/push are in-memory-only or unavailable)");
    if (isProd) warnings.push("DATABASE_URL is unset in production — no data will persist");
  }
  if (!has("HOST_TOKEN")) {
    disabled.push("Host passcode (the control room is OPEN — anyone can drive the event)");
    if (isProd) warnings.push("HOST_TOKEN is unset in production — the host control room is unprotected");
  }
  if (!(has("VAPID_PUBLIC_KEY") && has("VAPID_PRIVATE_KEY"))) {
    disabled.push("Web Push phone notifications (VAPID keys unset)");
  }
  if (!has("GEMINI_API_KEY")) disabled.push("AI session recaps (GEMINI_API_KEY unset)");
  if (!has("ELEVENLABS_API_KEY")) disabled.push("ElevenLabs voice / Scribe STT (ELEVENLABS_API_KEY unset)");

  return { disabled, warnings };
}

/** Log the env summary at startup (called from instrumentation). Never throws. */
export function logEnvSummary(): void {
  try {
    const { disabled, warnings } = summarizeEnv();
    console.info(`[env] ${warnings.length ? "starting with warnings" : "startup check ok"}`);
    for (const w of warnings) console.warn(`[env] ⚠ ${w}`);
    for (const d of disabled) console.info(`[env] · off: ${d}`);
  } catch {
    /* never let env logging break startup */
  }
}
