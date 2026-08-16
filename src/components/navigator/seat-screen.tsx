"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Maximize2, MapPin, Navigation } from "lucide-react";
import { TappableNavi } from "@/components/navigator/tappable-navi";
import { Reveal } from "@/components/navigator/reveal";
import { LectureTheatreMap, MapLegend } from "@/components/seating/lecture-theatre-map";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AVATAR_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";
import { SEAT_INTRO, SEAT_INTRO_UNASSIGNED } from "@/constants/avatar-scripts";
import { AvatarMood } from "@/constants/statuses";
import { MapView, VENUE_DETAIL, VENUE_NAME } from "@/constants/seating";
import { template } from "@/utils/format";
import { buildSeatDirections, getSeat } from "@/utils/seats";
import { refreshSeat, usePlayerIdentity } from "@/utils/player-identity";
import { useNaviGestures } from "@/utils/use-navi-gestures";

/**
 * "Find my seat" — Navi names the attendee's seat, the Lecture Theatre plan
 * highlights and zooms to it, and the walking directions below are derived from
 * the plan geometry (`buildSeatDirections`), never written per attendee.
 *
 * The seat comes from the identity the server issued at registration, so a
 * host re-assigning someone in the roster console changes what they see here
 * the next time the page loads.
 */
export function SeatScreen() {
  const identity = usePlayerIdentity();
  const gestures = useNaviGestures();
  const [view, setView] = useState<MapView>(MapView.Focus);

  // The host may have moved this attendee since they registered — re-read their
  // seat from the server on open. Fired from a timer so nothing sets state
  // synchronously inside the effect body.
  useEffect(() => {
    const timer = setTimeout(() => void refreshSeat(), 0);
    return () => clearTimeout(timer);
  }, []);

  const seat = getSeat(identity.seat.seatId);
  const firstName = identity.name.split(" ")[0];
  const intro = seat
    ? template(SEAT_INTRO, { name: firstName, seat: seat.id, row: seat.row })
    : template(SEAT_INTRO_UNASSIGNED, { name: firstName });
  const displayIntro = gestures.pop ?? intro;
  const directions = seat ? buildSeatDirections(seat) : [];

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-12 pt-6">
      <Reveal delay={0}>
        <Card className="gap-0 overflow-hidden rounded-3xl border-border/60 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <TappableNavi
              gestures={gestures}
              name={firstName}
              baseMood={AvatarMood.Guiding}
              className="size-16"
              label={`Tap ${AVATAR_NAME}, your guide, to say hi`}
            />
            <div className="min-w-0 pt-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <MapPin className="size-3.5" />
                {VENUE_NAME} · {VENUE_DETAIL}
              </span>
              <h1 className="mt-0.5 text-2xl font-semibold tracking-tight">
                {seat ? `Seat ${seat.id}` : "Your seat"}
              </h1>
            </div>
          </div>

          <p
            key={displayIntro}
            className="animate-navi-tip mt-3 text-pretty text-sm leading-relaxed text-muted-foreground"
          >
            {displayIntro}
          </p>
        </Card>
      </Reveal>

      <Reveal delay={120}>
        <Card className="gap-3 rounded-3xl border-border/60 p-4 shadow-soft">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {view === MapView.Focus && seat ? "Zoomed to your seat" : "Whole theatre"}
            </p>
            {seat ? (
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() =>
                  setView((current) =>
                    current === MapView.Focus ? MapView.Full : MapView.Focus,
                  )
                }
              >
                <Maximize2 className="size-4" />
                {view === MapView.Focus ? "Show whole theatre" : "Zoom to my seat"}
              </Button>
            ) : null}
          </div>

          <div className="overflow-hidden rounded-2xl">
            <LectureTheatreMap
              highlightSeatId={seat?.id}
              view={seat ? view : MapView.Full}
              calloutLabel="Your seat"
            />
          </div>
          <MapLegend />
        </Card>
      </Reveal>

      {directions.length > 0 ? (
        <Reveal delay={220}>
          <Card className="gap-3 rounded-3xl border-border/60 p-5 shadow-soft">
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold">
              <Navigation className="size-4 text-brand-blue" />
              Getting there
            </p>
            <ol className="flex flex-col gap-3">
              {directions.map((step, index) => (
                <li key={step.instruction} className="flex items-start gap-3">
                  <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-blue/10 font-mono text-xs font-bold text-brand-blue">
                    {index + 1}
                  </span>
                  <span className="min-w-0 leading-tight">
                    <span className="block text-sm font-medium">{step.instruction}</span>
                    <span className="block text-xs text-muted-foreground">
                      {step.detail}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </Card>
        </Reveal>
      ) : null}

      <Reveal delay={300}>
        <div className="flex justify-center pt-1">
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
