import { AvatarHost } from "@/components/navigator/avatar-host";
import { AVATAR_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { GAME_SCRIPTS } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";

/**
 * Pre-round "get ready" overlay: Navi hypes the attendee while a big countdown
 * ticks down. The parent flips to the live round when the count hits zero.
 */
export function GameIntro({ name, count }: { name: string; count: number }) {
  return (
    <div className="animate-in fade-in absolute inset-0 z-40 grid place-items-center bg-white/65 px-6 text-center backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <AvatarHost mood={AvatarMood.Excited} className="size-24" />
        <p className="mt-4 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {AVATAR_NAME}
        </p>
        <p className="mt-1 max-w-xs text-balance text-lg font-semibold leading-snug">
          {template(GAME_SCRIPTS.getReady, { name })}
        </p>
        <p
          key={count}
          className="animate-in zoom-in-50 text-gradient-brand mt-4 font-mono text-7xl font-bold tabular-nums"
        >
          {count > 0 ? count : "GO!"}
        </p>
      </div>
    </div>
  );
}
