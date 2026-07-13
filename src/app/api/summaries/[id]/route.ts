import { getDb } from "@/server/db";
import { toSummary, updateSummaryContent } from "@/server/db/summaries";
import { SUMMARY_LIMITS } from "@/constants/summaries";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH — save an attendee's edit to their recap (marks it edited). */
export async function PATCH(request: Request, { params }: Ctx) {
  const db = getDb();
  if (!db) {
    return Response.json({ ok: false, error: "database not configured" }, { status: 503 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.content !== "string" || body.content.trim().length === 0) {
    return Response.json({ ok: false, error: "content required" }, { status: 400 });
  }

  try {
    const content = body.content.slice(0, SUMMARY_LIMITS.contentMax);
    const row = await updateSummaryContent(db, id, content);
    if (!row) return Response.json({ ok: false, error: "not found" }, { status: 404 });
    return Response.json({ summary: toSummary(row) });
  } catch (error) {
    console.error("summary update failed", error);
    return Response.json({ ok: false, error: "update failed" }, { status: 500 });
  }
}
