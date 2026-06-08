import { ELEVENLABS_CONFIG } from "@/constants/voice";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Navi voice (cloud TTS). The client POSTs a scripted line; we call ElevenLabs
 * with the SERVER-ONLY key and return the MP3. Generated clips are cached in
 * memory (Navi's lines are scripted + repeat across attendees), so repeats are
 * instant and cost nothing. Returns 501 when no key is configured — the client
 * then falls back to the free Web Speech voice, so Navi always speaks.
 */

const ELEVENLABS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const CACHE_LIMIT = 100;
const cache = new Map<string, ArrayBuffer>();

const AUDIO_HEADERS = {
  "Content-Type": "audio/mpeg",
  "Cache-Control": "public, max-age=86400",
} as const;

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    // Not configured — let the client fall back to the browser voice.
    return Response.json({ ok: false, error: "voice not configured" }, { status: 501 });
  }

  const body = await request.json().catch(() => null);
  const text = body && typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ ok: false, error: "missing text" }, { status: 400 });
  }

  const voiceId = process.env.ELEVENLABS_VOICE_ID || ELEVENLABS_CONFIG.defaultVoiceId;
  const cacheKey = `${voiceId}:${text}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    return new Response(cached, { headers: AUDIO_HEADERS });
  }

  const upstream = await fetch(
    `${ELEVENLABS_URL}/${voiceId}?output_format=${ELEVENLABS_CONFIG.outputFormat}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_CONFIG.model,
        voice_settings: ELEVENLABS_CONFIG.voiceSettings,
      }),
    },
  ).catch(() => null);

  if (!upstream || !upstream.ok) {
    const detail = upstream ? await upstream.text().catch(() => "") : "network error";
    return Response.json(
      { ok: false, error: "tts upstream failed", detail: detail.slice(0, 200) },
      { status: 502 },
    );
  }

  const audio = await upstream.arrayBuffer();
  // Cap the in-memory cache (simple FIFO eviction of the oldest clip).
  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(cacheKey, audio);

  return new Response(audio, { headers: AUDIO_HEADERS });
}
