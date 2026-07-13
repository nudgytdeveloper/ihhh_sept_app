"use client";

import { useEffect, useRef, useState } from "react";
import { TappableNavi } from "@/components/navigator/tappable-navi";
import { usePlayerCount, useWinnerName } from "@/components/navigator/attendee-shell";
import { AVATAR_NAME } from "@/constants/app";
import { NaviReaction, NAVI_CONFIG, NAVI_TAP_HINT } from "@/constants/navi";
import { TourAnchor } from "@/constants/tutorial";
import type { AvatarScript } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";
import { getNaviArrivalLine, formatNaviPresence, formatNaviWinner } from "@/utils/navi";
import { useNaviGestures } from "@/utils/use-navi-gestures";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * NaviHost — the *interactive* event host (home hero only). On top of the
 * scripted greeting + speech bubble, Navi feels alive:
 *
 * - tap her → bounce + sparkle burst + happy-mood flash + a one-liner that swaps
 *   into her bubble (spoken aloud if voice is on)
 * - idle → the occasional wink / look-around so she never looks frozen
 * - live event → an excited wiggle + a contextual line when the host advances the
 *   phase, or when the attendee headcount jumps
 *
 * The tap/idle/reaction mechanics live in `useNaviGestures`; this component adds
 * the bubble swap, the live-event triggers, and the first-time "tap me" hint.
 * Crucially it stays host-led — Navi offers, the attendee never asks (no chat box).
 */
export function NaviHost({ script, name }: { script: AvatarScript; name: string }) {
  const message = template(script.message, { name });
  const phase = script.phase;
  const count = usePlayerCount();
  const winnerName = useWinnerName();
  const { enabled, speak } = useNaviVoice();
  const gestures = useNaviGestures({ idle: true });
  const { trigger, pop } = gestures;
  const [showHint, setShowHint] = useState(false);

  const nameRef = useRef(name);
  useEffect(() => {
    nameRef.current = name;
  });

  // Read her scripted line aloud when voice is on (and the moment it's enabled).
  useEffect(() => {
    if (enabled) speak(message);
  }, [enabled, message, speak]);

  // Live: the host advanced the event → exclaim + wiggle (the scripted message
  // read above carries the voice, so she doesn't talk over herself).
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current === phase) return;
    prevPhaseRef.current = phase;
    trigger(NaviReaction.Wiggle, { line: getNaviArrivalLine(phase, nameRef.current) });
  }, [phase, trigger]);

  // Live: more attendees joined → a quick "ooh, we're growing!" (throttled).
  const prevCountRef = useRef(count);
  const lastPresenceAt = useRef(0);
  useEffect(() => {
    const prev = prevCountRef.current;
    prevCountRef.current = count;
    if (prev <= 0 || count <= prev) return;
    const now = Date.now();
    if (now - lastPresenceAt.current < NAVI_CONFIG.presenceCooldownMs) return;
    lastPresenceAt.current = now;
    trigger(NaviReaction.Wiggle, { line: formatNaviPresence(count), speak: true });
  }, [count, trigger]);

  // Live: the host announced the winner → Navi cheers visually (a wiggle + the
  // cheer line in her bubble). The voice/toast/confetti are owned by AttendeeShell
  // (room-wide), so she stays silent here and doesn't talk over herself.
  const prevWinnerRef = useRef(winnerName);
  useEffect(() => {
    if (prevWinnerRef.current === winnerName) return;
    prevWinnerRef.current = winnerName;
    if (winnerName) trigger(NaviReaction.Wiggle, { line: formatNaviWinner(winnerName) });
  }, [winnerName, trigger]);

  // First-time discovery hint, dismissed for good on the first tap.
  const hasInteracted = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasInteracted.current) setShowHint(true);
    }, NAVI_CONFIG.tapHintDelayMs);
    return () => window.clearTimeout(timer);
  }, []);

  const line = pop ?? message;

  return (
    <div data-tour={TourAnchor.Navi} className="flex w-full flex-col items-center text-center">
      <TappableNavi
        gestures={gestures}
        name={name}
        baseMood={script.mood}
        className="size-32 sm:size-36"
        label={`Tap ${AVATAR_NAME}, your event host, to say hi`}
        onTap={() => {
          hasInteracted.current = true;
          setShowHint(false);
        }}
      >
        {showHint ? (
          <span className="animate-bob absolute -right-1 top-1 z-10 inline-flex items-center gap-1 rounded-full bg-brand-blue px-2.5 py-1 text-xs font-semibold text-white shadow-soft">
            <span aria-hidden>👆</span>
            {NAVI_TAP_HINT}
          </span>
        ) : null}
      </TappableNavi>

      {/* Host attribution */}
      <div className="mt-3 inline-flex items-center gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-muted-foreground">
          {AVATAR_NAME} · your event host
        </span>
      </div>

      {/* Speech bubble — her scripted line, or a tap/live one-liner that swaps in */}
      <div className="relative mt-4 w-full">
        <div
          aria-hidden
          className="glass absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-border/60"
        />
        <div className="glass relative rounded-2xl border border-border/60 px-5 py-4 shadow-soft">
          <p className="text-sm font-semibold text-brand-blue">{script.greeting}</p>
          <p
            key={line}
            aria-live="polite"
            className="animate-navi-tip mt-1.5 text-pretty text-lg font-medium leading-snug text-foreground"
          >
            {line}
          </p>
        </div>
      </div>
    </div>
  );
}
