"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_NAME } from "@/constants/app";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * A compact speaker toggle that turns Navi's voice on/off. Lives in the attendee
 * header, so the preference follows the attendee across every screen. Renders
 * nothing when the browser can't speak.
 */
export function NaviVoiceToggle({ className }: { className?: string }) {
  const { enabled, supported, toggle } = useNaviVoice();
  if (!supported) return null;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label={enabled ? `Mute ${AVATAR_NAME}'s voice` : `Let ${AVATAR_NAME} speak`}
      className={cn(
        "h-8 gap-1.5 rounded-full px-2.5 text-xs font-medium",
        enabled ? "text-brand-blue" : "text-muted-foreground",
        className,
      )}
    >
      {enabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
      <span className="hidden sm:inline">{enabled ? "Voice on" : "Voice off"}</span>
    </Button>
  );
}
