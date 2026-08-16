import Link from "next/link";
import { BadgeCheck, Armchair, MapPin, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { RegistrationStatus } from "@/constants/statuses";
import { SEAT_DISPLAY } from "@/constants/seating";
import { getSeat } from "@/utils/seats";
import type { Attendee } from "@/types";

/**
 * Compact attendee status: check-in state + Lecture Theatre seat. IHH asked for
 * the bare seat id ("SEAT A12") with a "See Map" CTA right on the tile, and for
 * anyone without a designated seat to be sent to Reception rather than shown a
 * blank — so the seat tile has exactly two states.
 */
export function StatusCard({ attendee }: { attendee: Attendee }) {
  const checkedIn = attendee.registration === RegistrationStatus.Complete;
  const placed = getSeat(attendee.seat.seatId);

  return (
    <Card className="grid grid-cols-2 items-start gap-2 rounded-2xl border-border/60 p-3 shadow-soft">
      <StatusTile
        icon={BadgeCheck}
        tone={
          checkedIn
            ? "bg-emerald-500/10 text-emerald-600"
            : "bg-muted text-muted-foreground"
        }
        label="Registration"
        value={checkedIn ? "Checked in" : "Incomplete"}
        sub={checkedIn ? "You're all set" : "Action needed"}
      />

      <div className="flex flex-col gap-2">
        <StatusTile
          icon={placed ? Armchair : MapPin}
          tone="bg-brand-blue/10 text-brand-blue"
          label="Your seat"
          value={
            placed
              ? `${SEAT_DISPLAY.prefix} ${placed.id}`
              : SEAT_DISPLAY.unassignedLabel
          }
          note={placed ? undefined : SEAT_DISPLAY.unassignedNote}
        />
        <Button
          asChild
          size="sm"
          className={cn(
            "bg-brand-gradient h-8 w-full rounded-lg border-0 px-3 text-xs font-semibold text-white shadow-soft transition",
            "hover:brightness-105 active:brightness-95",
          )}
        >
          <Link
            href={ROUTES.SEAT}
            aria-label="See my seat on the Lecture Theatre plan"
          >
            {SEAT_DISPLAY.mapCta}
            <ChevronRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </Card>
  );
}

function StatusTile({
  icon: Icon,
  tone,
  label,
  value,
  sub,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string;
  sub?: string;
  /** Emphasised aside next to the value, e.g. "(Approach Reception)". */
  note?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl", tone)}>
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-pretty text-sm font-semibold leading-snug">
          {value}
          {note ? (
            <span className="ml-1 text-xs font-medium text-rose-600">{note}</span>
          ) : null}
        </p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}
