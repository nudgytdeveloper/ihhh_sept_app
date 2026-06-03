import { CalendarClock } from "lucide-react";
import { ScreenStub } from "@/components/scaffold/screen-stub";
import { ROUTES } from "@/constants/routes";

export const metadata = { title: "Schedule" };

export default function SchedulePage() {
  return (
    <ScreenStub
      icon={CalendarClock}
      eyebrow="Screen 2"
      title="Event Schedule"
      description="The full phase timeline — Registered through Closing — showing where the event is now and what's coming next."
      gradient="from-sky-400 to-blue-500"
      currentHref={ROUTES.SCHEDULE}
    />
  );
}
