import { Bell } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Reminder } from "@/types";

/** Proactive reminders the avatar keeps an eye on for the attendee. */
export function RemindersCard({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) return null;

  return (
    <Card className="gap-0 rounded-2xl border-border/60 p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <Bell className="size-4 text-brand-blue" />
        <h2 className="text-sm font-semibold">Reminders</h2>
      </div>

      <ul className="mt-3 space-y-2.5">
        {reminders.map((reminder) => {
          const Icon = reminder.icon;
          return (
            <li key={reminder.id} className="flex items-center gap-3">
              <div
                className={cn(
                  "grid size-10 shrink-0 place-items-center rounded-xl",
                  reminder.accent,
                )}
              >
                <Icon className="size-5" />
              </div>
              <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-sm font-semibold">
                  {reminder.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {reminder.detail}
                </p>
              </div>
              {reminder.time ? (
                <span className="shrink-0 font-mono text-xs font-medium text-muted-foreground tabular-nums">
                  {reminder.time}
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
