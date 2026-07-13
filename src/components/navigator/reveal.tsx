import { cn } from "@/lib/utils";

/**
 * Staggered entrance wrapper — fades + slides content up on mount.
 * Pure CSS (tw-animate-css), so it works in server components.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  anchor,
}: {
  children: React.ReactNode;
  /** Delay in milliseconds. */
  delay?: number;
  className?: string;
  /** Optional `data-tour` anchor id (lets the onboarding tour target this block). */
  anchor?: string;
}) {
  return (
    <div
      data-tour={anchor}
      className={cn("animate-in fade-in slide-in-from-bottom-4", className)}
      style={{
        animationDuration: "600ms",
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
}
