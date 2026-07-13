"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePushSubscription } from "@/utils/push";
import { usePlayerIdentity } from "@/utils/player-identity";
import { PushStatus } from "@/constants/push";
import { AVATAR_NAME } from "@/constants/app";

/**
 * Home opt-in for phone alerts (Phase 5). Navi offers to ping the attendee for
 * the next thing on the timeline — game time, buffet, their next session — even
 * with the app closed. Hidden entirely when push can't work (unsupported device
 * or switched off server-side), so it only appears when it can deliver.
 */
export function NotificationsCard() {
  const { status, busy, enable, disable } = usePushSubscription();
  const identity = usePlayerIdentity();

  const handleEnable = useCallback(async () => {
    const ok = await enable(identity.id);
    if (ok) {
      toast.success("Phone alerts on — watch for a test ping!");
    } else {
      toast.error("Couldn't turn on alerts — allow notifications for this site and try again.");
    }
  }, [enable, identity.id]);

  const handleDisable = useCallback(async () => {
    await disable();
    toast("Phone alerts turned off.");
  }, [disable]);

  // Nothing to show while still resolving, on an unsupported browser, or when
  // push isn't configured server-side.
  if (
    status === PushStatus.Unknown ||
    status === PushStatus.Unsupported ||
    status === PushStatus.Unconfigured
  ) {
    return null;
  }

  const isOn = status === PushStatus.On;
  const isBlocked = status === PushStatus.Blocked;

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div
        className={
          isOn
            ? "flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600"
            : "bg-brand-gradient flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-soft"
        }
      >
        {isOn ? <BellRing className="size-5" /> : isBlocked ? <BellOff className="size-5" /> : <Bell className="size-5" />}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-semibold">
          {isOn ? "Phone alerts are on" : isBlocked ? "Alerts are blocked" : "Never miss a moment"}
        </p>
        <p className="text-xs text-muted-foreground">
          {isOn
            ? `${AVATAR_NAME} will ping this phone for what's next — even with the app closed.`
            : isBlocked
              ? "Turn notifications back on for this site in your browser settings."
              : `Let ${AVATAR_NAME} nudge you when it's game time, buffet, or your next session.`}
        </p>
      </div>

      {isOn ? (
        <Button
          size="sm"
          variant="ghost"
          className="shrink-0 text-muted-foreground"
          onClick={handleDisable}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          On
        </Button>
      ) : isBlocked ? null : (
        <Button
          size="sm"
          className="bg-brand-gradient shrink-0 border-0 text-white hover:brightness-105"
          onClick={handleEnable}
          disabled={busy}
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
          Turn on
        </Button>
      )}
    </div>
  );
}
