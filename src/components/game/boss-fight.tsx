"use client";

import { useRef, useState } from "react";
import { Hand } from "lucide-react";
import { cn } from "@/lib/utils";
import { BossVirus } from "@/components/game/boss-virus";
import {
  BossOutcome,
  BossShape,
  BOSS_NAME,
  SHAPE_META,
  GAME_CONFIG,
} from "@/constants/game";
import { GAME_SCRIPTS } from "@/constants/avatar-scripts";
import { template, formatScore } from "@/utils/format";
import { matchShape, type StrokePoint } from "@/utils/shape-detection";

/** Minimum stroke points before we judge it a real attempt vs. a stray tap. */
const MIN_ATTEMPT_POINTS = 8;

/**
 * The COVID Boss encounter (Screen 4). The attendee traces the required shape on
 * a drawing surface; on a confident match we report a defeat to the parent,
 * which awards the bonus. The parent owns the countdown and the escape (timeout).
 */
export function BossFight({
  requiredShape,
  secondsLeft,
  outcome,
  onDefeat,
}: {
  requiredShape: BossShape;
  secondsLeft: number;
  outcome: BossOutcome;
  onDefeat: (confidence: number) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointsRef = useRef<StrokePoint[]>([]);
  const [points, setPoints] = useState<StrokePoint[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const meta = SHAPE_META[requiredShape];
  const ShapeIcon = meta.icon;
  const resolved = outcome !== BossOutcome.Pending;
  const timePct =
    Math.max(0, Math.min(1, secondsLeft / GAME_CONFIG.bossTimeLimitSeconds)) * 100;

  function toLocal(e: React.PointerEvent): StrokePoint {
    const rect = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function handleDown(e: React.PointerEvent) {
    if (resolved) return;
    e.preventDefault();
    svgRef.current?.setPointerCapture(e.pointerId);
    setDrawing(true);
    setFeedback(null);
    const start = [toLocal(e)];
    pointsRef.current = start;
    setPoints(start);
  }

  function handleMove(e: React.PointerEvent) {
    if (!drawing || resolved) return;
    const p = toLocal(e);
    const prev = pointsRef.current;
    const last = prev[prev.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 3) return;
    const next = [...prev, p];
    pointsRef.current = next;
    setPoints(next);
  }

  function handleUp() {
    if (!drawing) return;
    setDrawing(false);
    const stroke = pointsRef.current;
    const { matched, confidence } = matchShape(stroke, requiredShape);
    if (matched) {
      onDefeat(confidence); // keep the winning stroke on screen
      return;
    }
    setFeedback(
      stroke.length < MIN_ATTEMPT_POINTS
        ? `Draw a bigger ${meta.label.toLowerCase()}!`
        : `Almost! Trace the ${meta.label.toLowerCase()} again.`,
    );
    pointsRef.current = [];
    setPoints([]);
  }

  return (
    <div className="animate-in fade-in absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-foreground/45 p-4 text-center backdrop-blur-[2px]">
      {/* Boss */}
      <div
        className={cn(
          "transition-all duration-700",
          outcome === BossOutcome.Defeated && "scale-125 opacity-0",
          outcome === BossOutcome.Escaped && "-translate-y-10 opacity-0",
        )}
      >
        <div className={cn(!resolved && "animate-bob")}>
          <BossVirus className="size-24 drop-shadow-[0_10px_24px_rgba(190,30,70,0.4)]" />
        </div>
      </div>

      {/* Prompt */}
      <div className="flex items-center gap-2 rounded-full bg-white/85 px-4 py-1.5 text-sm font-semibold text-foreground shadow-soft">
        <ShapeIcon className="size-4 text-rose-500" />
        {template(GAME_SCRIPTS.bossWarning, { shape: meta.label.toLowerCase(), boss: BOSS_NAME })}
      </div>

      {/* Boss timer */}
      <div className="w-full max-w-xs">
        <div className="flex items-center justify-between text-xs font-medium text-white/90">
          <span>Time to draw</span>
          <span className="font-mono tabular-nums">{Math.max(0, secondsLeft)}s</span>
        </div>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/25">
          <div
            className="h-full rounded-full bg-white transition-[width] duration-1000 ease-linear"
            style={{ width: `${timePct}%` }}
          />
        </div>
      </div>

      {/* Drawing surface */}
      <div className="relative h-56 w-full max-w-xs overflow-hidden rounded-2xl border border-white/60 bg-white/90 shadow-soft-lg">
        <ShapeIcon
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 size-36 -translate-x-1/2 -translate-y-1/2 text-foreground/[0.08]"
          strokeWidth={1.5}
        />
        <svg
          ref={svgRef}
          className={cn("absolute inset-0 size-full touch-none", resolved && "pointer-events-none")}
          onPointerDown={handleDown}
          onPointerMove={handleMove}
          onPointerUp={handleUp}
          onPointerCancel={handleUp}
        >
          {points.length > 1 ? (
            <polyline
              points={points.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              strokeWidth={6}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                stroke: "var(--brand-blue)",
                filter: "drop-shadow(0 1px 3px oklch(0.57 0.19 257 / 0.45))",
              }}
            />
          ) : null}
        </svg>

        {/* Resolution flourish */}
        {outcome === BossOutcome.Defeated ? (
          <div className="animate-in zoom-in-50 absolute inset-0 grid place-items-center bg-white/70">
            <div>
              <p className="text-gradient-brand font-mono text-4xl font-bold">
                +{formatScore(GAME_CONFIG.bossBonusPoints)}
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {template(GAME_SCRIPTS.bossDefeated, { boss: BOSS_NAME })}
              </p>
            </div>
          </div>
        ) : null}
        {outcome === BossOutcome.Escaped ? (
          <div className="animate-in fade-in absolute inset-0 grid place-items-center bg-white/70">
            <p className="px-4 text-sm font-semibold text-muted-foreground">
              {GAME_SCRIPTS.bossEscaped}
            </p>
          </div>
        ) : null}
      </div>

      {/* Hint / feedback */}
      <p
        className={cn(
          "flex items-center gap-1.5 text-xs font-medium",
          feedback ? "text-rose-100" : "text-white/85",
        )}
      >
        {!resolved ? <Hand className="size-3.5" /> : null}
        {resolved ? "" : (feedback ?? `Trace the ${meta.label.toLowerCase()} with your finger`)}
      </p>
    </div>
  );
}
