import { SlidersHorizontal } from "lucide-react";
import { APP_NAME, EVENT_NAME } from "@/constants/app";
import { GAME_NAME } from "@/constants/game";
import { HostNav } from "@/components/host/host-nav";

/**
 * Host-facing shell (control-room feel) — distinct from the attendee shell.
 * Wider layout, no ambient gradient, denser header.
 */
export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col bg-secondary/40">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-foreground text-background">
              <SlidersHorizontal className="size-5" strokeWidth={2} />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">{GAME_NAME} · Host Control</p>
              <p className="text-xs text-muted-foreground">
                {APP_NAME} · {EVENT_NAME}
              </p>
            </div>
          </div>
          <HostNav />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
