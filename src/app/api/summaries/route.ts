import { getDb } from "@/server/db";
import { getAttendeeById } from "@/server/db/attendees";
import { getSession } from "@/server/db/sessions";
import {
  getSummary,
  listSummariesForAttendee,
  toSummary,
  upsertSummary,
} from "@/server/db/summaries";
import { generateSummary } from "@/server/ai/summary";
import { checkRateLimit, getClientId, rateLimitResponse } from "@/server/rate-limit";
import { sanitizeLearningGoals } from "@/utils/registration";
import { EMPTY_LEARNING_GOALS } from "@/constants/registration";
import { RateLimitBucket } from "@/constants/rate-limit";
import type { LearningGoals, SummaryListResponse } from "@/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** GET ?attendeeId= — every recap this attendee has generated (hydrates /recaps). */
export async function GET(request: Request) {
  const db = getDb();
  if (!db) {
    return Response.json({ available: false, summaries: [] } satisfies SummaryListResponse);
  }
  const attendeeId = new URL(request.url).searchParams.get("attendeeId");
  if (!attendeeId) {
    return Response.json({ ok: false, error: "missing attendeeId" }, { status: 400 });
  }
  try {
    const rows = await listSummariesForAttendee(db, attendeeId);
    return Response.json({
      available: true,
      summaries: rows.map(toSummary),
    } satisfies SummaryListResponse);
  } catch (error) {
    console.error("summaries list failed", error);
    return Response.json({ ok: false, error: "summaries unavailable" }, { status: 500 });
  }
}

/**
 * POST — the attendee's personalized recap for a session. Returns the cached
 * summary if one exists (no API key needed); otherwise generates it with Gemini
 * (tailored to the attendee's learning goals), stores, and returns it. Pass
 * `regenerate: true` to force a fresh generation. Generation is rate-limited
 * (cache hits are not), since each fresh recap is a paid Gemini call.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId : "";
  const attendeeId = typeof body?.attendeeId === "string" ? body.attendeeId : "";
  const regenerate = body?.regenerate === true;
  if (!sessionId || !attendeeId) {
    return Response.json({ ok: false, error: "sessionId and attendeeId required" }, { status: 400 });
  }

  try {
    // Cache hit — return it without needing the API key.
    if (!regenerate) {
      const cached = await getSummary(db, sessionId, attendeeId);
      if (cached) return Response.json({ summary: toSummary(cached) });
    }

    // Past the cache: this will be a paid generation — rate-limit it per IP.
    const limit = checkRateLimit(RateLimitBucket.Summaries, getClientId(request));
    if (!limit.ok) return rateLimitResponse(limit);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json({ ok: false, error: "summaries not configured" }, { status: 501 });
    }

    const session = await getSession(db, sessionId);
    if (!session) {
      return Response.json({ ok: false, error: "session not found" }, { status: 404 });
    }
    if (!session.transcript.trim()) {
      return Response.json({ ok: false, error: "session has no transcript yet" }, { status: 400 });
    }

    // Prefer the attendee's stored goals/name; fall back to what the client sent.
    const attendee = await getAttendeeById(db, attendeeId);
    const goals: LearningGoals =
      attendee?.goals ?? sanitizeLearningGoals(body?.goals) ?? EMPTY_LEARNING_GOALS;
    const attendeeName =
      attendee?.name ?? (typeof body?.name === "string" ? body.name : "");

    let content: string;
    try {
      content = await generateSummary(apiKey, {
        title: session.title,
        speaker: session.speaker,
        attendeeName,
        goals,
        transcript: session.transcript,
      });
    } catch (error) {
      console.error("summary generation failed", error);
      return Response.json({ ok: false, error: "generation failed" }, { status: 502 });
    }

    const row = await upsertSummary(db, { sessionId, attendeeId, content });
    return Response.json({ summary: toSummary(row) }, { status: 201 });
  } catch (error) {
    console.error("summary request failed", error);
    return Response.json({ ok: false, error: "summary unavailable" }, { status: 500 });
  }
}
