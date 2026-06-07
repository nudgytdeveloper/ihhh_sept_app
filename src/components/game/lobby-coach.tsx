"use client";

import { AvatarHost } from "@/components/navigator/avatar-host";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { PLAYER_NAME_FALLBACK } from "@/constants/player";
import { LOBBY_INTRO } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";
import { usePlayerIdentity } from "@/utils/player-identity";

/**
 * Compact Navi presence for the lobby — the host coaches the attendee before
 * the round, greeting them by their onboarded name (avatar leads, in keeping
 * with the product direction).
 */
export function LobbyCoach() {
  const identity = usePlayerIdentity();
  const firstName = (identity.name || PLAYER_NAME_FALLBACK).split(" ")[0];
  const line = template(LOBBY_INTRO, { name: firstName });

  return (
    <div className="flex items-start gap-3">
      <AvatarHost mood={AvatarMood.Excited} className="size-14 shrink-0" />
      <div className="glass relative mt-1 flex-1 rounded-2xl border border-border/60 px-4 py-3 shadow-soft">
        <div
          aria-hidden
          className="glass absolute -left-1.5 top-4 size-3 rotate-45 rounded-[2px] border-b border-l border-border/60"
        />
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="text-brand-blue">{AVATAR_NAME}</span> · your coach
        </p>
        <p className="mt-0.5 text-sm font-medium leading-snug text-foreground">
          {line}
        </p>
      </div>
    </div>
  );
}
