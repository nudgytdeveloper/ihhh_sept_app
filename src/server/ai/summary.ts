import { SUMMARY_CONFIG } from "@/constants/summaries";
import type { LearningGoals } from "@/types";

/**
 * Personalized session-summary generation with Claude (Anthropic Messages API),
 * server-only. The route passes the secret ANTHROPIC_API_KEY (never bundled to
 * the client). Called only when no cached summary exists for this attendee.
 */

const SYSTEM_PROMPT = `You are the IHHH 2026 event companion — a warm, concise event host who writes a personalized recap of a conference talk for a single attendee, tailored to the learning goals they set at registration.

Write in PLAIN TEXT only (no markdown symbols like # or **). Structure it exactly as:
1. A 1-2 sentence recap of what the talk covered.
2. A line "Key points:" then 2-4 bullets, each starting with "• ".
3. A line "Your action items:" then 2-3 concrete, personal bullets (each starting with "• ") that connect the talk to this attendee's goals.

Keep the whole thing under 180 words, friendly and specific. Ground everything in the transcript — do not invent facts or claims the speaker did not make. If the transcript is too short or off-topic to cover a goal, focus the action items on what the talk actually offered.`;

export interface SummaryInput {
  title: string;
  speaker: string;
  goals: LearningGoals;
  transcript: string;
}

/** One readable line of the attendee's goals for the prompt. */
function goalsLine(goals: LearningGoals): string {
  const all = [...goals.selected, goals.custom.trim()].filter(Boolean);
  return all.length > 0 ? all.join("; ") : "not specified";
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Generate the recap. Retries transient upstream blips (5xx / 429 / network);
 * throws on a permanent failure so the route can surface a 502.
 */
export async function generateSummary(apiKey: string, input: SummaryInput): Promise<string> {
  const transcript = input.transcript.slice(0, SUMMARY_CONFIG.maxTranscriptChars);
  const userPrompt = `Talk: "${input.title}" by ${input.speaker}
This attendee's learning goals: ${goalsLine(input.goals)}

Transcript:
"""
${transcript}
"""`;

  const body = JSON.stringify({
    model: process.env.ANTHROPIC_MODEL || SUMMARY_CONFIG.model,
    max_tokens: SUMMARY_CONFIG.maxTokens,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let upstream: Response | null = null;
  for (let attempt = 0; attempt <= SUMMARY_CONFIG.retries; attempt++) {
    if (attempt > 0) await sleep(SUMMARY_CONFIG.retryDelayMs * attempt);
    upstream = await fetch(SUMMARY_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": SUMMARY_CONFIG.anthropicVersion,
        "content-type": "application/json",
      },
      body,
    }).catch(() => null);
    // Success or a permanent 4xx (bad key/model/quota) — stop; retrying won't help.
    if (upstream && (upstream.ok || (upstream.status >= 400 && upstream.status < 500))) break;
  }

  if (!upstream || !upstream.ok) {
    const detail = upstream ? await upstream.text().catch(() => "") : "network error";
    throw new Error(`anthropic upstream failed: ${detail.slice(0, 200)}`);
  }

  const data = (await upstream.json().catch(() => null)) as {
    content?: Array<{ type?: string; text?: string }>;
  } | null;
  const text = (data?.content ?? [])
    .filter((block) => block.type === "text" && typeof block.text === "string")
    .map((block) => block.text)
    .join("")
    .trim();
  if (!text) throw new Error("anthropic returned no text");
  return text;
}
