import { cn } from "@/lib/utils";

/**
 * Staggered entrance wrapper — fades + slides content up on mount.
 * Pure CSS (tw-animate-css), so it works in server components.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  /** Delay in milliseconds. */
  delay?: number;
  className?: string;
}) {
  return (
    <div
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
