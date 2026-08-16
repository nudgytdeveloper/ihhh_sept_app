import Link from "next/link";
import { BadgeCheck, Armchair, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { RegistrationStatus, SeatStatus } from "@/constants/statuses";
import { getSeat } from "@/utils/seats";
import type { Attendee } from "@/types";

/**
 * Compact attendee status: check-in state + Lecture Theatre seat. The seat tile
 * links to the seat map, which is the attendee's route to "where do I sit?".
 */
export function StatusCard({ attendee }: { attendee: Attendee }) {
  const checkedIn = attendee.registration === RegistrationStatus.Complete;
  const { seat } = attendee;
  const placed = getSeat(seat.seatId);
  const seatReady = placed !== undefined || seat.status !== SeatStatus.Unassigned;
  // Legacy rows (pre-seat-map) still carry the old banquet fields.
  const seatValue = placed
    ? `Seat ${placed.id}`
    : [seat.table, seat.seat].filter(Boolean).join(" · ");

  return (
    <Card className="grid grid-cols-2 gap-2 rounded-2xl border-border/60 p-3 shadow-soft">
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
      <Link
        href={ROUTES.SEAT}
        className="rounded-xl transition-colors hover:bg-muted/60"
        aria-label="Find my seat on the Lecture Theatre plan"
      >
        <StatusTile
          icon={seatReady ? Armchair : MapPin}
          tone="bg-brand-blue/10 text-brand-blue"
          label="Your seat"
          value={seatReady ? seatValue : "To be assigned"}
          sub={placed ? `Row ${placed.row} · tap for the map` : "Tap for the map"}
        />
      </Link>
    </Card>
  );
}

function StatusTile({
  icon: Icon,
  tone,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <div
        className={cn(
          "grid size-10 shrink-0 place-items-center rounded-xl",
          tone,
        )}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0 leading-tight">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-sm font-semibold leading-snug">{value}</p>
        {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      </div>
    </div>
  );
}
