"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AvatarMood } from "@/constants/statuses";
import {
  TUTORIAL_ATTR,
  TUTORIAL_AUTOSTART_DELAY_MS,
  TUTORIAL_CALLOUT_WIDTH,
  TUTORIAL_COPY,
  TUTORIAL_SPOTLIGHT_PADDING,
  TutorialPlacement,
  TutorialTour,
  type TutorialStep,
} from "@/constants/tutorial";
import {
  computeCalloutLayout,
  hasCompletedTour,
  markTourComplete,
  startTour,
  useTutorial,
  type CalloutLayout,
  type TargetRect,
} from "@/utils/tutorial";

/**
 * Navi-led coach-mark tour engine. Given a tour id + its steps, it:
 *  - auto-starts once on a device that hasn't finished this tour,
 *  - dims the screen and spotlights each step's target (`data-tour="<anchor>"`),
 *  - floats a Navi callout beside it with Back / Next / Got it controls, and
 *  - stamps the tour complete (localStorage) on finish or skip.
 *
 * Missing anchors (e.g. the notifications card when push is unavailable) are
 * dropped up front so the step counter stays honest. Rendered into a portal so
 * it sits above the sticky header, and fully keyboard- + reduced-motion-friendly.
 */
export function GuidedTour({ tour, steps }: { tour: TutorialTour; steps: TutorialStep[] }) {
  const { activeTour } = useTutorial();
  const active = activeTour === tour;

  const [mounted, setMounted] = useState(false);
  const [resolved, setResolved] = useState<TutorialStep[]>([]);
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<TargetRect | null>(null);
  const [layout, setLayout] = useState<CalloutLayout | null>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const calloutElRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef(0);

  // Portal is client-only (needs document.body); flip once after mount.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);
  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const finish = useCallback(() => {
    markTourComplete(tour);
    setRect(null);
    setLayout(null);
  }, [tour]);

  // Auto-start once per device (after the screen paints its anchors).
  useEffect(() => {
    if (hasCompletedTour(tour)) return;
    const id = window.setTimeout(() => {
      const anyAnchor = steps.some((step) =>
        document.querySelector(`[${TUTORIAL_ATTR}="${step.anchor}"]`),
      );
      if (anyAnchor) startTour(tour);
    }, TUTORIAL_AUTOSTART_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [tour, steps]);

  // On (re)start, keep only the steps whose targets are actually on screen.
  useEffect(() => {
    if (!active) return;
    const present = steps.filter((step) =>
      document.querySelector(`[${TUTORIAL_ATTR}="${step.anchor}"]`),
    );
    // Reading which anchors exist in the DOM on activation is exactly what an
    // effect is for; the resolved list + reset index then drive the overlay.
    /* eslint-disable react-hooks/set-state-in-effect */
    setResolved(present);
    setStepIndex(0);
    /* eslint-enable react-hooks/set-state-in-effect */
    if (present.length === 0) finish();
  }, [active, steps, finish]);

  const step = active ? resolved[stepIndex] : undefined;

  // Measure the current target and place the callout beside it.
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector<HTMLElement>(`[${TUTORIAL_ATTR}="${step.anchor}"]`);
    if (!el) return;
    const r = el.getBoundingClientRect();
    const target: TargetRect = {
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
      bottom: r.bottom,
      right: r.right,
    };
    setRect(target);
    const calloutWidth = Math.min(TUTORIAL_CALLOUT_WIDTH, window.innerWidth - 24);
    // Real callout height (once rendered) so a tall target can't push it off-screen.
    const calloutHeight = calloutElRef.current?.offsetHeight ?? 180;
    setLayout(
      computeCalloutLayout(
        target,
        window.innerWidth,
        window.innerHeight,
        calloutWidth,
        calloutHeight,
        step.placement ?? TutorialPlacement.Auto,
      ),
    );
  }, [step]);

  // Coalesce bursts of measure requests (a scroll/resize storm) to one per frame,
  // so listeners can never drive a synchronous setState feedback loop.
  const scheduleMeasure = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => measure());
  }, [measure]);

  // Bring the target into view (instant — a smooth scroll would fire a storm of
  // scroll events), then measure. The first pass is synchronous so the callout
  // appears immediately (not dependent on requestAnimationFrame, which browsers
  // pause on hidden/idle tabs); a short setTimeout re-measures once the callout
  // has painted, so its true height positions it. Bounded — no observer.
  useEffect(() => {
    if (!active || !step) return;
    const el = document.querySelector<HTMLElement>(`[${TUTORIAL_ATTR}="${step.anchor}"]`);
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    // Measure DOM geometry now to place the callout immediately (a legitimate
    // read-layout-then-set-state effect), then re-measure once it has painted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    measure();
    const id = window.setTimeout(measure, 60);
    return () => window.clearTimeout(id);
  }, [active, step, measure]);

  // Keep the spotlight glued to the target as the page scrolls / resizes.
  useEffect(() => {
    if (!active) return;
    window.addEventListener("resize", scheduleMeasure);
    window.addEventListener("scroll", scheduleMeasure, true);
    return () => {
      window.removeEventListener("resize", scheduleMeasure);
      window.removeEventListener("scroll", scheduleMeasure, true);
    };
  }, [active, scheduleMeasure]);

  // Keyboard: Esc dismisses, arrows navigate. Focus the primary button per step.
  useEffect(() => {
    if (!active) return;
    nextRef.current?.focus();
  }, [active, stepIndex]);

  if (!active || !mounted || !step || !rect || !layout) return null;

  const total = resolved.length;
  const isFirst = stepIndex === 0;
  const isLast = stepIndex >= total - 1;
  const goNext = () => (isLast ? finish() : setStepIndex((i) => i + 1));
  const goBack = () => setStepIndex((i) => Math.max(0, i - 1));

  const pad = TUTORIAL_SPOTLIGHT_PADDING;
  const onTop = layout.placement === TutorialPlacement.Top;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={TUTORIAL_COPY.ariaLabel}
      className="fixed inset-0 z-[70]"
      onKeyDown={(event) => {
        if (event.key === "Escape") finish();
        else if (event.key === "ArrowRight") goNext();
        else if (event.key === "ArrowLeft" && !isFirst) goBack();
      }}
    >
      {/* Click-catcher — makes the page inert while the tour runs (no dismiss on
          stray taps; the Skip button + Esc are the ways out). */}
      <div className="absolute inset-0" aria-hidden="true" />

      {/* Spotlight — the huge box-shadow dims everything except this rect. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute rounded-2xl transition-[top,left,width,height] duration-300 ease-out motion-reduce:transition-none"
        style={{
          top: rect.top - pad,
          left: rect.left - pad,
          width: rect.width + pad * 2,
          height: rect.height + pad * 2,
          boxShadow: "0 0 0 3px #3b6df6, 0 0 0 9999px rgba(2, 6, 23, 0.62)",
        }}
      />

      {/* Navi callout */}
      <div
        ref={calloutElRef}
        className="absolute transition-[top,left] duration-300 ease-out motion-reduce:transition-none"
        style={{
          top: layout.top,
          left: layout.left,
          width: `min(${TUTORIAL_CALLOUT_WIDTH}px, calc(100vw - 1.5rem))`,
        }}
      >
        <div className="relative rounded-2xl border border-border bg-card p-4 shadow-soft-lg">
          {/* pointer toward the target */}
          <span
            aria-hidden="true"
            className="absolute size-3 rotate-45 border-border bg-card"
            style={{
              left: layout.arrowLeft - 6,
              ...(onTop
                ? { bottom: -6, borderRight: "1px solid", borderBottom: "1px solid" }
                : { top: -6, borderLeft: "1px solid", borderTop: "1px solid" }),
            }}
          />

          <div className="flex items-center gap-3">
            <AvatarHost mood={AvatarMood.Guiding} className="size-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-[0.68rem] font-semibold uppercase tracking-wide text-brand-blue">
                {TUTORIAL_COPY.step(stepIndex + 1, total)}
              </p>
              <h2 className="font-heading text-base font-bold leading-tight">{step.title}</h2>
            </div>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{step.body}</p>

          {/* progress dots */}
          <div className="mt-3 flex items-center gap-1.5" aria-hidden="true">
            {resolved.map((s, i) => (
              <span
                key={s.anchor}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === stepIndex ? "w-4 bg-brand-blue" : "w-1.5 bg-muted-foreground/30",
                )}
              />
            ))}
          </div>

          <div className="mt-3.5 flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={finish}
              className="px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              {TUTORIAL_COPY.skip}
            </Button>
            <div className="flex items-center gap-2">
              {!isFirst ? (
                <Button variant="outline" size="sm" onClick={goBack} className="gap-1">
                  <ArrowLeft className="size-3.5" />
                  {TUTORIAL_COPY.back}
                </Button>
              ) : null}
              <Button
                ref={nextRef}
                size="sm"
                onClick={goNext}
                className="bg-brand-gradient gap-1 border-0 text-white shadow-soft hover:brightness-105"
              >
                {isLast ? TUTORIAL_COPY.done : TUTORIAL_COPY.next}
                {isLast ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
