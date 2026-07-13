import { Compass } from "lucide-react";
import { APP_NAME, EVENT_NAME, EVENT_VENUE } from "@/constants/app";
import { NaviVoiceToggle } from "@/components/navigator/navi-voice-toggle";
import { NotificationToggle } from "@/components/navigator/notification-toggle";
import { AttendeeShell } from "@/components/navigator/attendee-shell";

/**
 * Shell for all attendee-facing screens: soft ambient backdrop, branded
 * header, and a mobile-first centered column (responsive up to desktop).
 */
export default function AttendeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-app-ambient flex min-h-dvh flex-col">
      <header className="glass sticky top-0 z-30 border-b border-border/60">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-brand-gradient flex size-9 items-center justify-center rounded-xl text-white shadow-soft">
              <Compass className="size-5" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{APP_NAME}</p>
              <p className="text-xs text-muted-foreground">{EVENT_NAME}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <p className="hidden text-right text-xs text-muted-foreground sm:block">
              {EVENT_VENUE}
            </p>
            <NotificationToggle />
            <NaviVoiceToggle />
          </div>
        </div>
      </header>

      {/* Owns the attendee realtime subscription (live phase + reminders) and
          gates the app behind the welcome step until the attendee is onboarded. */}
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col">
        <AttendeeShell>{children}</AttendeeShell>
      </main>
    </div>
  );
}
