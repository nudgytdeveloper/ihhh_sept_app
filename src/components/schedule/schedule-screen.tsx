"use client";

import Link from "next/link";
import { Bell, ChevronLeft } from "lucide-react";
import { ScheduleOverview } from "@/components/schedule/schedule-overview";
import { ScheduleTimeline } from "@/components/schedule/schedule-timeline";
import { Reveal } from "@/components/navigator/reveal";
import { useEventPhase } from "@/components/navigator/attendee-shell";
import { Button } from "@/components/ui/button";
import { AVATAR_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { usePlayerIdentity } from "@/utils/player-identity";
import { MOCK_SCHEDULE } from "@/data/event";

/**
 * Screen 2 — Event Schedule / Phase Timeline. Navi orients the attendee, then a
 * vertical timeline lays out the full journey with the current phase emphasized.
 * The current phase is host-driven (live over the realtime channel) and the name
 * comes from the onboarded identity, so the timeline stays in sync with the host.
 */
export function ScheduleScreen() {
  const phase = useEventPhase();
  const identity = usePlayerIdentity();
  const firstName = identity.name.split(" ")[0];
  const footerDelay = 120 + MOCK_SCHEDULE.length * 70 + 80;

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-12 pt-6">
      <Reveal delay={0}>
        <ScheduleOverview phase={phase} name={firstName} />
      </Reveal>

      <ScheduleTimeline items={MOCK_SCHEDULE} currentPhase={phase} />

      <Reveal delay={footerDelay}>
        <div className="flex flex-col items-center gap-3 pt-1 text-center">
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Bell className="size-3.5" />
            {AVATAR_NAME} will nudge you when each phase begins.
          </p>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full text-muted-foreground"
          >
            <Link href={ROUTES.HOME}>
              <ChevronLeft className="size-4" />
              Back to home
            </Link>
          </Button>
        </div>
      </Reveal>
    </div>
  );
}
