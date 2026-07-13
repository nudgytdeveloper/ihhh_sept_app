"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  MessageCircle,
  Pencil,
  RotateCw,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SUMMARIES_API_PATH } from "@/constants/summaries";
import { AVATAR_NAME } from "@/constants/app";
import { buildWhatsAppShareUrl } from "@/utils/summaries";
import type { LearningGoals, Session, Summary } from "@/types";

/**
 * One session's personalized recap: generate it (Claude, keyed to the
 * attendee's learning goals), read it, edit it, and share it to WhatsApp.
 */
export function SummaryCard({
  session,
  summary,
  attendeeId,
  attendeeName,
  goals,
  onSummary,
}: {
  session: Session;
  summary: Summary | null;
  attendeeId: string;
  attendeeName: string;
  goals: LearningGoals;
  onSummary: (summary: Summary) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  const generate = useCallback(
    async (regenerate: boolean) => {
      setBusy(true);
      try {
        const response = await fetch(SUMMARIES_API_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, attendeeId, name: attendeeName, goals, regenerate }),
        });
        if (response.status === 501) {
          toast.error(`${AVATAR_NAME}'s AI recaps aren't switched on yet.`);
          return;
        }
        if (!response.ok) throw new Error(String(response.status));
        const { summary: created } = (await response.json()) as { summary: Summary };
        onSummary(created);
        if (regenerate) toast.success("Fresh recap ready.");
      } catch {
        toast.error("Couldn't write the recap — please try again.");
      } finally {
        setBusy(false);
      }
    },
    [session.id, attendeeId, attendeeName, goals, onSummary],
  );

  const startEdit = useCallback(() => {
    if (!summary) return;
    setDraft(summary.content);
    setEditing(true);
  }, [summary]);

  const saveEdit = useCallback(async () => {
    if (!summary) return;
    setSaving(true);
    try {
      const response = await fetch(`${SUMMARIES_API_PATH}/${summary.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft }),
      });
      if (!response.ok) throw new Error(String(response.status));
      const { summary: updated } = (await response.json()) as { summary: Summary };
      onSummary(updated);
      setEditing(false);
      toast.success("Recap saved.");
    } catch {
      toast.error("Couldn't save your edit.");
    } finally {
      setSaving(false);
    }
  }, [summary, draft, onSummary]);

  const share = useCallback(() => {
    if (!summary) return;
    window.open(buildWhatsAppShareUrl(session, summary.content), "_blank", "noopener,noreferrer");
  }, [session, summary]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex items-start justify-between gap-3 border-b border-border/60 p-4">
        <div className="min-w-0">
          <h3 className="truncate font-semibold">{session.title}</h3>
          <p className="truncate text-xs text-muted-foreground">{session.speaker}</p>
        </div>
        {summary ? (
          <Badge variant="outline" className="shrink-0 gap-1 border-brand-purple/30 text-brand-purple">
            <Sparkles className="size-3" />
            {summary.edited ? "Edited" : "Your recap"}
          </Badge>
        ) : null}
      </div>

      {!summary ? (
        <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
          <div className="bg-brand-gradient flex size-11 items-center justify-center rounded-xl text-white shadow-soft">
            <Sparkles className="size-5" />
          </div>
          <p className="max-w-[18rem] text-sm text-muted-foreground">
            {AVATAR_NAME} can write you a personal recap of this talk, tuned to your learning goals.
          </p>
          <Button onClick={() => generate(false)} disabled={busy} className="bg-brand-gradient text-white">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {busy ? "Writing your recap…" : "Generate my recap"}
          </Button>
        </div>
      ) : editing ? (
        <div className="flex flex-col gap-3 p-4">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            className="h-56 w-full resize-y rounded-lg border border-input bg-background p-3 text-sm leading-relaxed outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveEdit} disabled={saving || draft.trim().length === 0}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              <X className="size-4" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{summary.content}</p>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
            <Button
              size="sm"
              onClick={share}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <MessageCircle className="size-4" />
              Share on WhatsApp
            </Button>
            <Button size="sm" variant="outline" onClick={startEdit}>
              <Pencil className="size-4" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="text-muted-foreground"
              onClick={() => generate(true)}
              disabled={busy}
            >
              {busy ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
