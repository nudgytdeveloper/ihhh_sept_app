import { MiniVirus } from "@/components/game/mini-virus";

/** A live mini-virus in the arena (position/size/motion decided on spawn). */
export interface ActiveVirus {
  id: number;
  /** Horizontal position within the arena, in %. */
  xPct: number;
  /** Vertical position within the arena, in %. */
  yPct: number;
  /** Rendered size, in px. */
  size: number;
  /** Per-virus float animation delay/duration so they bob out of sync (ms). */
  floatDelay: number;
  floatDuration: number;
}

/**
 * A single tappable mini-virus. Pops on tap (parent scores it + removes it);
 * floats and zooms in on spawn for energy. `touch-manipulation` keeps taps
 * snappy on mobile.
 */
export function TappableVirus({
  virus,
  onPop,
}: {
  virus: ActiveVirus;
  onPop: (virus: ActiveVirus) => void;
}) {
  return (
    <button
      type="button"
      aria-label="Pop virus"
      onClick={() => onPop(virus)}
      className="animate-in zoom-in-75 fade-in absolute -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-full outline-none transition-transform duration-100 hover:scale-110 focus-visible:ring-2 focus-visible:ring-brand-blue/50 active:scale-90"
      style={{
        left: `${virus.xPct}%`,
        top: `${virus.yPct}%`,
        width: virus.size,
        height: virus.size,
        animationDuration: "200ms",
      }}
    >
      <span
        className="animate-float block size-full"
        style={{
          animationDelay: `${virus.floatDelay}ms`,
          animationDuration: `${virus.floatDuration}ms`,
        }}
      >
        <MiniVirus className="drop-shadow-[0_6px_12px_rgba(20,50,74,0.18)]" />
      </span>
    </button>
  );
}
