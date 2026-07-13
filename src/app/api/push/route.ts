import { getPushPublicKey, isPushConfigured } from "@/server/push/send";
import type { PushConfigResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Push config for the client: whether Web Push is switched on server-side and,
 * if so, the VAPID public key the browser needs to create a subscription. The
 * private key never leaves the server.
 */
export async function GET() {
  return Response.json({
    configured: isPushConfigured(),
    publicKey: getPushPublicKey(),
  } satisfies PushConfigResponse);
}
