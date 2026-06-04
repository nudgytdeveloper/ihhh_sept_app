import { cn } from "@/lib/utils";
import { BOSS_NAME } from "@/constants/game";

/**
 * The COVID Boss — a bigger, meaner cousin of the mini-virus (rose→purple,
 * angry brows, little crown). Defeated by drawing the required shape.
 * Pure SVG; the parent handles entrance/defeat motion.
 */
export function BossVirus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 96"
      className={cn("size-full", className)}
      role="img"
      aria-label={BOSS_NAME}
    >
      <defs>
        <linearGradient id="boss-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.66 0.2 18)" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 350)" />
        </linearGradient>
      </defs>

      {/* Spikes */}
      <g stroke="oklch(0.6 0.21 12)" strokeWidth={6} strokeLinecap="round">
        <line x1="48" y1="6" x2="48" y2="20" />
        <line x1="48" y1="76" x2="48" y2="90" />
        <line x1="6" y1="48" x2="20" y2="48" />
        <line x1="76" y1="48" x2="90" y2="48" />
        <line x1="18" y1="18" x2="28" y2="28" />
        <line x1="68" y1="68" x2="78" y2="78" />
        <line x1="78" y1="18" x2="68" y2="28" />
        <line x1="28" y1="68" x2="18" y2="78" />
      </g>
      <g fill="oklch(0.6 0.21 12)">
        <circle cx="48" cy="6" r="4.5" />
        <circle cx="48" cy="90" r="4.5" />
        <circle cx="6" cy="48" r="4.5" />
        <circle cx="90" cy="48" r="4.5" />
        <circle cx="18" cy="18" r="4.5" />
        <circle cx="78" cy="78" r="4.5" />
        <circle cx="78" cy="18" r="4.5" />
        <circle cx="18" cy="78" r="4.5" />
      </g>

      {/* Body */}
      <circle cx="48" cy="50" r="28" fill="url(#boss-body)" />
      <ellipse cx="40" cy="40" rx="9" ry="6" fill="#ffffff" opacity="0.2" />

      {/* Little crown */}
      <path
        d="M34 26 L40 33 L48 24 L56 33 L62 26 L60 38 L36 38 Z"
        fill="oklch(0.85 0.16 85)"
        stroke="oklch(0.7 0.16 70)"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />

      {/* Angry brows */}
      <g stroke="#3a0d1a" strokeWidth={3.5} strokeLinecap="round">
        <line x1="36" y1="45" x2="46" y2="49" />
        <line x1="60" y1="45" x2="50" y2="49" />
      </g>

      {/* Eyes */}
      <g>
        <ellipse cx="41" cy="54" rx="5.5" ry="6.5" fill="#fff" />
        <ellipse cx="55" cy="54" rx="5.5" ry="6.5" fill="#fff" />
        <circle cx="42" cy="56" r="3" fill="#3a0d1a" />
        <circle cx="54" cy="56" r="3" fill="#3a0d1a" />
      </g>

      {/* Frown + fangs */}
      <path
        d="M40 68 Q48 61 56 68"
        fill="none"
        stroke="#3a0d1a"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <path d="M44 64 L46 69 L48 64 Z" fill="#fff" />
      <path d="M48 64 L50 69 L52 64 Z" fill="#fff" />
    </svg>
  );
}
