import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { SCHEDULE_CTA_LABEL } from "@/constants/avatar-scripts";

/**
 * The journey block's fixed route into the full programme. It sits directly
 * under the event-journey track (which is why that card no longer carries its
 * own "Full schedule" header link) — one obvious way through to the schedule.
 */
export function ScheduleCta() {
  return (
    <Button
      asChild
      size="lg"
      className={cn(
        "bg-brand-gradient h-12 w-full rounded-xl border-0 px-6 text-base font-semibold text-white shadow-soft transition",
        "hover:brightness-105 hover:shadow-soft-lg active:brightness-95",
      )}
    >
      <Link href={ROUTES.SCHEDULE}>
        {SCHEDULE_CTA_LABEL}
        <ChevronRight className="size-4" />
      </Link>
    </Button>
  );
}
