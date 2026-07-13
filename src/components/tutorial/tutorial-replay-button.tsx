"use client";

import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TUTORIAL_COPY, TutorialTour } from "@/constants/tutorial";
import { useTutorial } from "@/utils/tutorial";

/**
 * Quiet "Replay tour" affordance. Re-triggers the walkthrough on demand (after
 * the first-run auto-start), so a returning user — or a presenter mid-demo — can
 * ask Navi to show them around again. Must be rendered on the screen whose tour
 * it replays (the on-screen `GuidedTour` engine picks it up via the store).
 */
export function TutorialReplayButton({
  tour,
  className,
}: {
  tour: TutorialTour;
  className?: string;
}) {
  const { start } = useTutorial();
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => start(tour)}
      className={cn("gap-1.5 text-xs text-muted-foreground hover:text-foreground", className)}
    >
      <Compass className="size-4" />
      {TUTORIAL_COPY.restart}
    </Button>
  );
}
