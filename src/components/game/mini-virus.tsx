import { cn } from "@/lib/utils";

/**
 * A cute mini-virus blob — the thing attendees tap for points in Virus Fight.
 * Used here as a playful preview accent; reused by the game screen later.
 */
export function MiniVirus({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("size-full", className)}
      role="img"
      aria-label="Mini virus"
    >
      <defs>
        <linearGradient id="virus-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="oklch(0.78 0.13 185)" />
          <stop offset="100%" stopColor="oklch(0.62 0.16 230)" />
        </linearGradient>
      </defs>

      {/* Spikes */}
      <g stroke="oklch(0.7 0.15 200)" strokeWidth={5} strokeLinecap="round">
        <line x1="32" y1="6" x2="32" y2="16" />
        <line x1="32" y1="48" x2="32" y2="58" />
        <line x1="6" y1="32" x2="16" y2="32" />
        <line x1="48" y1="32" x2="58" y2="32" />
        <line x1="14" y1="14" x2="21" y2="21" />
        <line x1="43" y1="43" x2="50" y2="50" />
        <line x1="50" y1="14" x2="43" y2="21" />
        <line x1="21" y1="43" x2="14" y2="50" />
      </g>
      {/* Spike tips */}
      <g fill="oklch(0.7 0.15 200)">
        <circle cx="32" cy="6" r="3.5" />
        <circle cx="32" cy="58" r="3.5" />
        <circle cx="6" cy="32" r="3.5" />
        <circle cx="58" cy="32" r="3.5" />
        <circle cx="14" cy="14" r="3.5" />
        <circle cx="50" cy="50" r="3.5" />
        <circle cx="50" cy="14" r="3.5" />
        <circle cx="14" cy="50" r="3.5" />
      </g>

      {/* Body */}
      <circle cx="32" cy="32" r="18" fill="url(#virus-body)" />
      <ellipse cx="26" cy="26" rx="6" ry="4" fill="#ffffff" opacity="0.25" />

      {/* Face */}
      <circle cx="26" cy="31" r="2.6" fill="#15324a" />
      <circle cx="38" cy="31" r="2.6" fill="#15324a" />
      <path
        d="M26 38 Q32 43 38 38"
        fill="none"
        stroke="#15324a"
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </svg>
  );
}
