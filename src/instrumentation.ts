/**
 * Next.js instrumentation (Phase 6): `register()` runs once when the server boots.
 * We use it to log an environment summary (which features are on/off) — helpful
 * in the Render logs. Guarded to the Node.js runtime so it never runs on the edge.
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logEnvSummary } = await import("@/server/env");
    logEnvSummary();
  }
}
