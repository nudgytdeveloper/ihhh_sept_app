"use client";

import type { ReactNode } from "react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { NaviReaction } from "@/constants/navi";
import type { NaviGestures } from "@/utils/use-navi-gestures";

/**
 * A tappable Navi: the avatar wrapped in an accessible button that plays a tap
 * reaction (bounce + sparkle burst + a happy-mood flash + a spoken one-liner).
 * The reaction state comes from a shared `useNaviGestures()` owned by the parent,
 * so the parent can also swap the spoken line into its own bubble (`gestures.pop`).
 * `children` overlay the avatar (e.g. a "tap me" hint).
 */
export function TappableNavi({
  gestures,
  name,
  baseMood,
  className,
  label,
  onTap,
  children,
}: {
  gestures: NaviGestures;
  name: string;
  baseMood: AvatarMood;
  className?: string;
  label?: string;
  onTap?: () => void;
  children?: ReactNode;
}) {
  // Happy reactions (tap / live event) flash an excited face over the base mood.
  const isHappy =
    gestures.reaction === NaviReaction.Bounce ||
    gestures.reaction === NaviReaction.Wiggle;
  const mood = isHappy ? AvatarMood.Excited : baseMood;

  return (
    <button
      type="button"
      onClick={() => {
        gestures.tap(name);
        onTap?.();
      }}
      aria-label={label ?? `Tap ${AVATAR_NAME}, your event host, to say hi`}
      className="group relative shrink-0 rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-brand-blue/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <AvatarHost
        mood={mood}
        reaction={gestures.reaction}
        reactionKey={gestures.reactionKey}
        talking={gestures.talking}
        className={className}
      />
      {children}
    </button>
  );
}
