import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { AvatarMood } from "@/constants/statuses";

/**
 * Navi — the IHHH event host avatar. A friendly SVG mascot (gradient orb with a
 * headset) whose expression is driven by the Avatar Script Engine's mood.
 * Pure CSS/SVG: floats, blinks, and glows, with no client JS.
 */

type Mouth = "open" | "smile" | "soft";

interface MoodFace {
  mouth: Mouth;
  cheeks: boolean;
  sparkles: number;
}

const MOOD_FACE: Record<AvatarMood, MoodFace> = {
  [AvatarMood.Excited]: { mouth: "open", cheeks: true, sparkles: 4 },
  [AvatarMood.Celebrating]: { mouth: "open", cheeks: true, sparkles: 4 },
  [AvatarMood.Welcoming]: { mouth: "smile", cheeks: true, sparkles: 2 },
  [AvatarMood.Guiding]: { mouth: "smile", cheeks: false, sparkles: 1 },
  [AvatarMood.Relaxed]: { mouth: "soft", cheeks: true, sparkles: 1 },
};

const SPARKLE_POSITIONS = [
  "-right-1 top-3 size-5",
  "-left-2 top-8 size-4",
  "right-2 -bottom-1 size-4",
  "left-3 -top-2 size-3",
];

function Mouth({ variant }: { variant: Mouth }) {
  if (variant === "open") {
    return (
      <g>
        <path d="M48 67 Q60 88 72 67 Q60 73 48 67 Z" fill="#1e2a4a" />
        <path d="M53 78 Q60 84 67 78 Q60 81 53 78 Z" fill="#ff8fab" />
      </g>
    );
  }
  const d = variant === "smile" ? "M49 70 Q60 82 71 70" : "M51 71 Q60 78 69 71";
  return (
    <path
      d={d}
      fill="none"
      stroke="#1e2a4a"
      strokeWidth={4}
      strokeLinecap="round"
    />
  );
}

interface AvatarHostProps {
  mood?: AvatarMood;
  className?: string;
}

export function AvatarHost({
  mood = AvatarMood.Welcoming,
  className,
}: AvatarHostProps) {
  const face = MOOD_FACE[mood];

  return (
    <div className={cn("relative grid place-items-center", className)}>
      {/* Ambient glow + pulse ring */}
      <div
        aria-hidden
        className="bg-brand-gradient absolute inset-1 rounded-full opacity-25 blur-2xl"
      />
      <span
        aria-hidden
        className="animate-pulse-ring absolute inset-0 rounded-full ring-2 ring-brand-blue/30"
      />

      {/* Floating character */}
      <div className="animate-float relative">
        <svg
          viewBox="0 0 120 120"
          className="size-full drop-shadow-[0_8px_20px_rgba(47,109,246,0.25)]"
          role="img"
          aria-label="Navi, your event host avatar"
        >
          <defs>
            <linearGradient id="navi-body" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.18 256)" />
              <stop offset="55%" stopColor="oklch(0.58 0.18 270)" />
              <stop offset="100%" stopColor="oklch(0.6 0.2 300)" />
            </linearGradient>
          </defs>

          {/* Headset band */}
          <path
            d="M20 60 A40 40 0 0 1 100 60"
            fill="none"
            stroke="#2a3558"
            strokeWidth={7}
            strokeLinecap="round"
          />

          {/* Head */}
          <circle cx="60" cy="62" r="40" fill="url(#navi-body)" />
          {/* Soft top highlight */}
          <ellipse cx="48" cy="44" rx="18" ry="11" fill="#ffffff" opacity="0.18" />

          {/* Earpads */}
          <rect x="11" y="51" width="15" height="22" rx="7" fill="#2a3558" />
          <rect x="94" y="51" width="15" height="22" rx="7" fill="#2a3558" />

          {/* Mic arm */}
          <path
            d="M18 70 Q15 92 40 86"
            fill="none"
            stroke="#2a3558"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <circle cx="42" cy="85" r="4" fill="#2a3558" />

          {/* Cheeks */}
          {face.cheeks ? (
            <g fill="#ff7a9c" opacity="0.45">
              <ellipse cx="41" cy="71" rx="6" ry="4" />
              <ellipse cx="79" cy="71" rx="6" ry="4" />
            </g>
          ) : null}

          {/* Eyes (blink together) */}
          <g className="animate-blink">
            <ellipse cx="48" cy="56" rx="7" ry="9" fill="#ffffff" />
            <ellipse cx="72" cy="56" rx="7" ry="9" fill="#ffffff" />
            <circle cx="49" cy="58" r="4" fill="#1e2a4a" />
            <circle cx="73" cy="58" r="4" fill="#1e2a4a" />
            <circle cx="50.5" cy="56" r="1.4" fill="#ffffff" />
            <circle cx="74.5" cy="56" r="1.4" fill="#ffffff" />
          </g>

          <Mouth variant={face.mouth} />
        </svg>
      </div>

      {/* Sparkles */}
      {SPARKLE_POSITIONS.slice(0, face.sparkles).map((pos, i) => (
        <Sparkles
          key={pos}
          aria-hidden
          className={cn(
            "animate-sparkle absolute text-amber-300",
            pos,
          )}
          style={{ animationDelay: `${i * 0.45}s` }}
        />
      ))}
    </div>
  );
}
