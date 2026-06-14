"use client";

import { useEffect, useMemo, useState } from "react";
import { Lightbulb, RotateCw } from "lucide-react";
import { useEventPhase } from "@/components/navigator/attendee-shell";
import { AVATAR_NAME } from "@/constants/app";
import { NAVI_CONFIG } from "@/constants/navi";
import { template } from "@/utils/format";
import { getNaviTips } from "@/utils/navi";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * Navi's tips ticker — a rotating, phase-aware nudge of proactive guidance ("the
 * coffee bar has no queue", "draw the shape to beat the boss"). It auto-advances,
 * and the attendee can tap for another (which Navi reads aloud if voice is on).
 *
 * This is the host *offering* help, never a chat box — true to the navigator,
 * not-a-chatbot product direction.
 */
export function NaviTips({ name }: { name: string }) {
  const phase = useEventPhase();
  const { enabled, speak } = useNaviVoice();
  const tips = useMemo(
    () => getNaviTips(phase).map((tip) => template(tip, { name })),
    [phase, name],
  );
  const [index, setIndex] = useState(0);
  // Always modulo by the *current* tip count, so a phase change (which swaps the
  // tip set, sometimes to a shorter one) can never land out of range.
  const current = index % tips.length;

  // Auto-advance; the timer resets whenever `index` changes, so a manual tap also
  // restarts the dwell on the new tip.
  useEffect(() => {
    if (tips.length <= 1) return;
    const id = window.setTimeout(
      () => setIndex((i) => (i + 1) % tips.length),
      NAVI_CONFIG.tipRotateMs,
    );
    return () => window.clearTimeout(id);
  }, [index, tips.length]);

  const advance = () => {
    const next = (current + 1) % tips.length;
    setIndex(next);
    if (enabled) speak(tips[next]);
  };

  return (
    <button
      type="button"
      onClick={advance}
      aria-label={`${AVATAR_NAME}'s tip — tap for another`}
      className="glass group flex w-full items-center gap-3 rounded-2xl border border-border/50 px-4 py-2.5 text-left shadow-soft transition active:scale-[0.99] hover:shadow-soft-lg"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-400/15 text-amber-500">
        <Lightbulb className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {AVATAR_NAME}&apos;s tip
        </span>
        <span
          key={current}
          className="animate-navi-tip mt-0.5 line-clamp-2 text-sm font-medium leading-snug text-foreground"
        >
          {tips[current]}
        </span>
      </span>
      <RotateCw className="size-4 shrink-0 text-muted-foreground/70 transition-transform duration-300 group-hover:rotate-90 group-active:rotate-180" />
    </button>
  );
}
