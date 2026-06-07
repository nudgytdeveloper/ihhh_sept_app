"use client";

import { useCallback } from "react";
import { toast } from "sonner";
import { HOST_REMINDERS } from "@/constants/host";
import { useGameChannel } from "@/utils/use-game-channel";
import { speakLine } from "@/utils/navi-voice";

/**
 * Invisible client island mounted in the attendee shell. It listens for
 * host-pushed reminders over the realtime channel and surfaces them as a toast +
 * Navi voice line on whatever attendee screen the user happens to be on.
 */
export function AttendeeRealtimeListener() {
  const onReminder = useCallback((reminderId: string) => {
    const reminder = HOST_REMINDERS.find((item) => item.id === reminderId);
    if (!reminder) return;
    toast(reminder.label, { description: reminder.detail });
    speakLine(`${reminder.label}. ${reminder.detail}.`);
  }, []);

  useGameChannel({ onReminder });
  return null;
}
