"use client";

import { useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

/**
 * A celebratory confetti burst — pure CSS/DOM (no library, no backend), in the
 * brand palette. Mount it (keyed, so each celebration replays) and it rains a
 * one-shot burst from the top of the viewport, then fades. `pointer-events-none`,
 * so it never blocks the UI. Skipped entirely under prefers-reduced-motion.
 */

const CONFETTI_COLORS = [
  "#2f6df6", // brand blue
  "#14b8a6", // teal
  "#a855f7", // purple
  "#f59e0b", // amber
  "#38bdf8", // sky
  "#fb7185", // rose
];

interface Piece {
  left: number;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  color: string;
  size: number;
  round: boolean;
}

function buildPieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.45,
    duration: 2.6 + Math.random() * 1.8,
    drift: (Math.random() * 2 - 1) * 90,
    rotate: Math.random() * 900 - 450,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
    round: i % 3 === 0,
  }));
}

export function ConfettiBurst({
  count = 90,
  className,
}: {
  count?: number;
  className?: string;
}) {
  // Pieces are built once (this component is remounted per celebration), and
  // skipped for reduced-motion users (they still get the toast + crown badge).
  const [pieces] = useState(() => {
    const reduced =
      typeof window !== "undefined" &&
      (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
    return reduced ? [] : buildPieces(count);
  });

  if (pieces.length === 0) return null;

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-0 z-50 overflow-hidden",
        className,
      )}
    >
      {pieces.map((p, i) => (
        <span
          key={i}
          className="animate-confetti absolute -top-4 block"
          style={
            {
              left: `${p.left}%`,
              width: `${p.size}px`,
              height: `${p.size * 1.4}px`,
              backgroundColor: p.color,
              borderRadius: p.round ? "9999px" : "1px",
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
              "--drift": `${p.drift}px`,
              "--rot": `${p.rotate}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
