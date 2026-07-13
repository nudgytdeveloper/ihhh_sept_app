"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePushSubscription } from "@/utils/push";
import { usePlayerIdentity } from "@/utils/player-identity";
import { PushStatus } from "@/constants/push";

/**
 * Compact bell toggle for phone alerts, sitting in the attendee header next to
 * the voice toggle. Shares the push store with the home card, so both reflect
 * the same on/off state. Renders nothing when push can't work on this device or
 * isn't switched on server-side.
 */
export function NotificationToggle({ className }: { className?: string }) {
  const { status, busy, enable, disable } = usePushSubscription();
  const identity = usePlayerIdentity();

  const isOn = status === PushStatus.On;

  const toggle = useCallback(async () => {
    if (isOn) {
      await disable();
      toast("Phone alerts turned off.");
      return;
    }
    const ok = await enable(identity.id);
    if (ok) toast.success("Phone alerts on — watch for a test ping!");
    else toast.error("Couldn't turn on alerts — allow notifications for this site and try again.");
  }, [isOn, disable, enable, identity.id]);

  // Only offer the toggle when push is actually available + configured.
  if (status !== PushStatus.On && status !== PushStatus.Off && status !== PushStatus.Blocked) {
    return null;
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      disabled={busy || status === PushStatus.Blocked}
      aria-pressed={isOn}
      aria-label={isOn ? "Turn off phone alerts" : "Turn on phone alerts"}
      className={cn(
        "h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium",
        isOn ? "text-brand-blue" : "text-muted-foreground",
        className,
      )}
    >
      {busy ? (
        <Loader2 className="size-4 animate-spin" />
      ) : isOn ? (
        <BellRing className="size-4" />
      ) : (
        <Bell className="size-4" />
      )}
      <span className="hidden sm:inline">{isOn ? "Alerts on" : "Alerts"}</span>
    </Button>
  );
}
