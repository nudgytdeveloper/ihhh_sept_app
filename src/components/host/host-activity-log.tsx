import { Activity } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LOG_TONE_DOT, type LogTone } from "@/constants/host";

/** One line in the host activity feed. */
export interface LogEntry {
  id: number;
  message: string;
  time: string;
  tone: LogTone;
}

/** A running feed of the host's recent control actions (newest first). */
export function HostActivityLog({ log }: { log: LogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="size-4 text-brand-blue" />
          Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!log.length ? (
          <p className="py-1 text-sm text-muted-foreground">
            No actions yet — start the round to begin.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {log.map((entry) => (
              <li key={entry.id} className="flex items-start gap-2.5">
                <span
                  className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", LOG_TONE_DOT[entry.tone])}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">{entry.message}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{entry.time}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
