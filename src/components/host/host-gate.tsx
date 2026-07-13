"use client";

import { useCallback, useState } from "react";
import { KeyRound, Loader2, Lock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHostAuth } from "@/utils/host-auth";
import { HostAuthStatus } from "@/constants/host-auth";
import { APP_NAME } from "@/constants/app";
import { GAME_NAME } from "@/constants/game";

/**
 * Passcode gate for the host control room (Phase 6). While the server reports a
 * `HOST_TOKEN` is required, the host screens are hidden behind a passcode entry.
 * When no token is configured (open control room) or once unlocked, children
 * render as normal. Attendees are never affected — this only wraps `/host/*`.
 */
export function HostGate({ children }: { children: React.ReactNode }) {
  const { status, unlock } = useHostAuth();

  if (status === HostAuthStatus.Unknown) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="size-6 animate-spin" />
      </div>
    );
  }

  if (status === HostAuthStatus.Open || status === HostAuthStatus.Unlocked) {
    return <>{children}</>;
  }

  return <PasscodeForm onUnlock={unlock} />;
}

function PasscodeForm({ onUnlock }: { onUnlock: (token: string) => Promise<boolean> }) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  const submit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!value.trim() || busy) return;
      setBusy(true);
      setError(false);
      const ok = await onUnlock(value);
      if (!ok) {
        setError(true);
        setValue("");
      }
      setBusy(false);
    },
    [value, busy, onUnlock],
  );

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex size-12 items-center justify-center rounded-xl bg-foreground text-background">
          <Lock className="size-6" />
        </div>
        <h1 className="mt-4 text-lg font-bold">Host control room</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the host passcode to run {GAME_NAME} for {APP_NAME}. This keeps
          attendees from driving the event or sending phone alerts.
        </p>

        <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
          <div className="relative">
            <KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              autoFocus
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(false);
              }}
              placeholder="Passcode"
              aria-label="Host passcode"
              aria-invalid={error}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
          {error ? (
            <p className="text-xs font-medium text-rose-600">
              That passcode didn&apos;t match — try again.
            </p>
          ) : null}
          <Button type="submit" disabled={busy || !value.trim()} className="w-full">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
            Unlock control room
          </Button>
        </form>
      </div>
    </div>
  );
}
