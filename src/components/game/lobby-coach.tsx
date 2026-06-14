"use client";

import { TappableNavi } from "@/components/navigator/tappable-navi";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { PLAYER_NAME_FALLBACK } from "@/constants/player";
import { LOBBY_INTRO } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";
import { usePlayerIdentity } from "@/utils/player-identity";
import { useNaviGestures } from "@/utils/use-navi-gestures";

/**
 * Compact Navi presence for the lobby — the host coaches the attendee before the
 * round, greeting them by their onboarded name. Tap her for a playful one-liner
 * that swaps into the bubble (avatar leads, in keeping with the product direction).
 */
export function LobbyCoach() {
  const identity = usePlayerIdentity();
  const firstName = (identity.name || PLAYER_NAME_FALLBACK).split(" ")[0];
  const line = template(LOBBY_INTRO, { name: firstName });
  const gestures = useNaviGestures();
  const displayLine = gestures.pop ?? line;

  return (
    <div className="flex items-start gap-3">
      <TappableNavi
        gestures={gestures}
        name={firstName}
        baseMood={AvatarMood.Excited}
        className="size-14"
        label={`Tap ${AVATAR_NAME}, your coach, to say hi`}
      />
      <div className="glass relative mt-1 flex-1 rounded-2xl border border-border/60 px-4 py-3 shadow-soft">
        <div
          aria-hidden
          className="glass absolute -left-1.5 top-4 size-3 rotate-45 rounded-[2px] border-b border-l border-border/60"
        />
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          <span className="text-brand-blue">{AVATAR_NAME}</span> · your coach
        </p>
        <p
          key={displayLine}
          className="animate-navi-tip mt-0.5 text-sm font-medium leading-snug text-foreground"
        >
          {displayLine}
        </p>
      </div>
    </div>
  );
}
