import { SCRIBE_CONFIG } from "@/constants/sessions";
import type { TranscribeResponse } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Speech-to-text for one recorded audio segment. The host recorder POSTs a
 * short audio clip (multipart `file`); we forward it to ElevenLabs Scribe with
 * the SERVER-ONLY key (the same ELEVENLABS_API_KEY as Navi's voice) and return
 * the recognized `text`. Returns 501 when no key is configured — the recorder
 * then surfaces a clear "transcription not configured" state.
 */

/** Reject anything larger than this (a ~15s segment is well under a MB). */
const MAX_SEGMENT_BYTES = 25 * 1024 * 1024;
const UPSTREAM_RETRIES = 2;
const RETRY_DELAY_MS = 400;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** GET — whether cloud STT is configured, so the recorder can show a clear state. */
export function GET() {
  return Response.json({ configured: Boolean(process.env.ELEVENLABS_API_KEY) });
}

/** Call Scribe, retrying transient blips (5xx / network) with a short backoff. */
async function fetchScribe(init: RequestInit): Promise<Response | null> {
  let upstream: Response | null = null;
  for (let attempt = 0; attempt <= UPSTREAM_RETRIES; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS * attempt);
    upstream = await fetch(SCRIBE_CONFIG.endpoint, init).catch(() => null);
    // Success or a permanent 4xx (bad key/quota) — stop; retrying won't help.
    if (upstream && (upstream.ok || (upstream.status >= 400 && upstream.status < 500))) break;
  }
  return upstream;
}

export async function POST(request: Request) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return Response.json({ ok: false, error: "transcription not configured" }, { status: 501 });
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return Response.json({ ok: false, error: "missing audio" }, { status: 400 });
  }
  if (file.size > MAX_SEGMENT_BYTES) {
    return Response.json({ ok: false, error: "segment too large" }, { status: 413 });
  }

  const upstreamForm = new FormData();
  const filename = file instanceof File ? file.name : "segment.webm";
  upstreamForm.append("file", file, filename);
  upstreamForm.append("model_id", SCRIBE_CONFIG.modelId);
  upstreamForm.append("tag_audio_events", String(SCRIBE_CONFIG.tagAudioEvents));
  upstreamForm.append("diarize", String(SCRIBE_CONFIG.diarize));

  // Let fetch set the multipart Content-Type (with boundary) from the FormData.
  const upstream = await fetchScribe({
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: upstreamForm,
  });

  if (!upstream || !upstream.ok) {
    const detail = upstream ? await upstream.text().catch(() => "") : "network error";
    return Response.json(
      { ok: false, error: "stt upstream failed", detail: detail.slice(0, 200) },
      { status: 502 },
    );
  }

  const data = (await upstream.json().catch(() => null)) as { text?: unknown } | null;
  const text = typeof data?.text === "string" ? data.text : "";
  return Response.json({ text } satisfies TranscribeResponse);
}
