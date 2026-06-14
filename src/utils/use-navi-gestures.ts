"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { NaviReaction, NAVI_CONFIG } from "@/constants/navi";
import { nextNaviReaction, estimateTalkMs } from "@/utils/navi";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * The reusable mechanics behind Navi's "lively host" feel, shared by every
 * tappable Navi (home hero, lobby coach, schedule guide). It owns the transient
 * reaction + replay key, the speaking-mouth flag, the current one-liner (`pop`),
 * their timers, and the idle wink/glance loop. Callers decide *where* the
 * one-liner shows (swap it into their own bubble via `pop`) and *what* triggers
 * a reaction (`tap` for a tap, `trigger` for live events).
 *
 * `trigger`/`tap` are referentially stable, so effects that fire them (e.g. a
 * live phase change) can depend on them without re-running every render.
 */
export interface NaviGestures {
  /** Current transient expression (null = resting). */
  reaction: NaviReaction | null;
  /** Bump key — change it to (re)play the reaction even if it repeats. */
  reactionKey: number;
  /** Whether the mouth should animate (she's speaking). */
  talking: boolean;
  /** The active one-liner to surface, or null. */
  pop: string | null;
  /** Low-level: play a reaction, optionally with a spoken/displayed line. */
  trigger: (reaction: NaviReaction, opts?: { line?: string; speak?: boolean }) => void;
  /** A tap: bounce + a fresh, non-repeating, spoken one-liner for `name`. */
  tap: (name: string) => void;
}

export function useNaviGestures({ idle = true }: { idle?: boolean } = {}): NaviGestures {
  const { enabled, speak } = useNaviVoice();

  const [reaction, setReaction] = useState<NaviReaction | null>(null);
  const [reactionKey, setReactionKey] = useState(0);
  const [talking, setTalking] = useState(false);
  const [pop, setPop] = useState<string | null>(null);

  // Latched values read inside post-commit timers/handlers (kept current via an
  // effect so the stable callbacks below never close over stale values).
  const enabledRef = useRef(enabled);
  const speakRef = useRef(speak);
  const reactionRef = useRef<NaviReaction | null>(reaction);
  useEffect(() => {
    enabledRef.current = enabled;
    speakRef.current = speak;
    reactionRef.current = reaction;
  });

  const prevTapIndexRef = useRef(-1);
  const popTimer = useRef<number | undefined>(undefined);
  const talkTimer = useRef<number | undefined>(undefined);
  const restTimer = useRef<number | undefined>(undefined);

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

      // The mouth only moves when she actually has a voice (text still leads silently).
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

  const tap = useCallback(
    (name: string) => {
      const { index, text } = nextNaviReaction(prevTapIndexRef.current, name);
      prevTapIndexRef.current = index;
      trigger(NaviReaction.Bounce, { line: text, speak: true });
    },
    [trigger],
  );

  // Idle life: an occasional wink / glance so she never looks frozen.
  useEffect(() => {
    if (!idle) return;
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
          trigger(Math.random() < 0.5 ? NaviReaction.Wink : NaviReaction.Glance);
        }
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [idle, trigger]);

  // Clear timers on unmount.
  useEffect(
    () => () => {
      window.clearTimeout(popTimer.current);
      window.clearTimeout(talkTimer.current);
      window.clearTimeout(restTimer.current);
    },
    [],
  );

  return { reaction, reactionKey, talking, pop, trigger, tap };
}
