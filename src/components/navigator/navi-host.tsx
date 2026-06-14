"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { usePlayerCount } from "@/components/navigator/attendee-shell";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { NaviReaction, NAVI_CONFIG, NAVI_TAP_HINT } from "@/constants/navi";
import type { AvatarScript } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";
import {
  nextNaviReaction,
  getNaviArrivalLine,
  formatNaviPresence,
  estimateTalkMs,
} from "@/utils/navi";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * NaviHost — the *interactive* event host (home hero only). On top of the
 * scripted greeting + speech bubble, Navi now feels alive:
 *
 * - tap her → a springy bounce, a sparkle burst, a happy-mood flash, and a
 *   playful one-liner that swaps into her bubble (spoken aloud if voice is on)
 * - idle → the occasional wink / look-around so she never looks frozen
 * - live event → an excited wiggle + a contextual line when the host advances
 *   the phase, or when the attendee headcount jumps
 *
 * Crucially this stays *host-led*: Navi offers, the attendee never has to ask —
 * there is no chat box.
 */
export function NaviHost({ script, name }: { script: AvatarScript; name: string }) {
  const message = template(script.message, { name });
  const phase = script.phase;
  const count = usePlayerCount();
  const { enabled, speak } = useNaviVoice();

  const [reaction, setReaction] = useState<NaviReaction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [pop, setPop] = useState<string | null>(null);
  const [talking, setTalking] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Volatile values read inside stable callbacks/timers (no stale closures, and
  // `trigger` stays referentially stable so the live-event effects don't re-fire).
  const enabledRef = useRef(enabled);
  const nameRef = useRef(name);
  const speakRef = useRef(speak);
  const reactionRef = useRef<NaviReaction | null>(reaction);
  // Keep the latched values current for the post-commit timers/handlers that read
  // them, without re-creating `trigger` (so the live-event effects stay stable).
  useEffect(() => {
    enabledRef.current = enabled;
    nameRef.current = name;
    speakRef.current = speak;
    reactionRef.current = reaction;
  });

  const prevTapIndexRef = useRef(-1);
  const hasTappedRef = useRef(false);
  const popTimer = useRef<number | undefined>(undefined);
  const talkTimer = useRef<number | undefined>(undefined);
  const restTimer = useRef<number | undefined>(undefined);

  /** Play a reaction: gesture (+ optional bubble line, voice, and mouth movement). */
  const trigger = useCallback(
    (next: NaviReaction, opts: { line?: string; speak?: boolean } = {}) => {
      setReaction(next);
      setReactionKey((k) => k + 1);
      window.clearTimeout(restTimer.current);
      restTimer.current = window.setTimeout(
        () => setReaction(null),
        NAVI_CONFIG.reactionMs,
      );

      if (!opts.line) return;
      setPop(opts.line);
      window.clearTimeout(popTimer.current);
      popTimer.current = window.setTimeout(() => setPop(null), NAVI_CONFIG.popVisibleMs);

      // Mouth only moves when she actually has a voice (text still leads silently).
      if (enabledRef.current) {
        if (opts.speak) speakRef.current(opts.line);
        setTalking(true);
        window.clearTimeout(talkTimer.current);
        talkTimer.current = window.setTimeout(
          () => setTalking(false),
          estimateTalkMs(opts.line),
        );
      }
    },
    [],
  );

  const handleTap = useCallback(() => {
    hasTappedRef.current = true;
    setShowHint(false);
    const { index, text } = nextNaviReaction(prevTapIndexRef.current, nameRef.current);
    prevTapIndexRef.current = index;
    trigger(NaviReaction.Bounce, { line: text, speak: true });
  }, [trigger]);

  // Read her scripted line aloud when voice is on (and the moment it's enabled).
  useEffect(() => {
    if (enabled) speak(message);
  }, [enabled, message, speak]);

  // Live: the host advanced the event → exclaim + wiggle (voice stays with the
  // scripted message read above, so she doesn't talk over herself).
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

  // Idle life: an occasional wink / glance so she always looks awake.
  useEffect(() => {
    const reduced =
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (reduced) return;
    let active = true;
    let timer: number | undefined;
    const schedule = () => {
      const delay =
        NAVI_CONFIG.idleMinMs +
        Math.random() * (NAVI_CONFIG.idleMaxMs - NAVI_CONFIG.idleMinMs);
      timer = window.setTimeout(() => {
        if (!active) return;
        if (!document.hidden && reactionRef.current === null) {
          trigger(
            Math.random() < 0.5 ? NaviReaction.Wink : NaviReaction.Glance,
          );
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [trigger]);

  // First-time discovery hint, dismissed for good on the first tap.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!hasTappedRef.current) setShowHint(true);
    }, NAVI_CONFIG.tapHintDelayMs);
    return () => window.clearTimeout(timer);
  }, []);

  // Clear timers on unmount.
  useEffect(
    () => () => {
      window.clearTimeout(popTimer.current);
      window.clearTimeout(talkTimer.current);
      window.clearTimeout(restTimer.current);
    },
    [],
  );

  // Happy moments (tap / live) flash an excited face on top of her resting mood.
  const isHappy =
    reaction === NaviReaction.Bounce || reaction === NaviReaction.Wiggle;
  const effectiveMood = isHappy ? AvatarMood.Excited : script.mood;
  const line = pop ?? message;

  return (
    <div className="flex w-full flex-col items-center text-center">
      <button
        type="button"
        onClick={handleTap}
        aria-label={`Tap ${AVATAR_NAME}, your event host, to say hi`}
        className="group relative rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <AvatarHost
          mood={effectiveMood}
          reaction={reaction}
          reactionKey={reactionKey}
          talking={talking}
          className="size-32 sm:size-36"
        />
        {showHint ? (
          <span className="animate-bob absolute -right-1 top-1 z-10 inline-flex items-center gap-1 rounded-full bg-brand-blue px-2.5 py-1 text-xs font-semibold text-white shadow-soft">
            <span aria-hidden>👆</span>
            {NAVI_TAP_HINT}
          </span>
        ) : null}
      </button>

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
