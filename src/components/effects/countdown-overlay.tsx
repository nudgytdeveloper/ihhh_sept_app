"use client";

import { useEffect } from "react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { cn } from "@/lib/utils";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import {
  NAVI_COUNTDOWN_LEAD,
  NAVI_COUNTDOWN_GO,
  COUNTDOWN_WORDS,
  NAVI_COUNTDOWN_GO_WORD,
} from "@/constants/navi";
import { useNaviVoice } from "@/utils/navi-voice";
import type { CountdownValue } from "@/utils/use-countdown";

/**
 * The synchronized pre-round countdown overlay — Navi leads "3 · 2 · 1 · GO!" on
 * every phone at once (driven by `useCountdown`, kicked off by a realtime
 * countdown message). When voice is on, she narrates each tick aloud, so the
 * host's screen and the phones literally count together. Renders nothing when idle.
 */
export function CountdownOverlay({ value }: { value: CountdownValue }) {
  const { enabled, speak } = useNaviVoice();

  // Navi narrates each tick (when voice is on) — she "leads" the count.
  useEffect(() => {
    if (!enabled || value === null) return;
    speak(
      value === "go"
        ? NAVI_COUNTDOWN_GO_WORD
        : COUNTDOWN_WORDS[value] ?? `${value}!`,
    );
  }, [value, enabled, speak]);

  if (value === null) return null;
  const isGo = value === "go";

  return (
    <div className="fixed inset-0 z-[60] grid select-none place-items-center bg-slate-950/55 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 text-center">
        <AvatarHost mood={AvatarMood.Excited} className="size-24" />
        <p className="text-xs font-medium uppercase tracking-wide text-white/70">
          {AVATAR_NAME} says
        </p>
        <p className="text-pretty text-lg font-semibold text-white">
          {isGo ? "Here we go! 🎉" : NAVI_COUNTDOWN_LEAD}
        </p>
        <div
          key={String(value)}
          className={cn(
            "animate-countdown-pop font-heading font-black tabular-nums leading-none drop-shadow-[0_8px_24px_rgba(0,0,0,0.45)]",
            isGo ? "text-7xl text-brand-teal" : "text-[7rem] text-white",
          )}
        >
          {isGo ? NAVI_COUNTDOWN_GO : value}
        </div>
      </div>
    </div>
  );
}
