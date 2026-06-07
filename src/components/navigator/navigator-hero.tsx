"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_NAME } from "@/constants/app";
import { ActionIntent } from "@/constants/statuses";
import type { AvatarScript } from "@/constants/avatar-scripts";
import { template } from "@/utils/format";
import { useNaviVoice } from "@/utils/navi-voice";

/**
 * The hero of the navigator: the avatar host speaks first (scripted greeting +
 * message) and then offers a single clear next action — never a chat box.
 */
export function NavigatorHero({
  script,
  name,
}: {
  script: AvatarScript;
  name: string;
}) {
  const message = template(script.message, { name });
  const primary = script.action;
  const secondary = script.secondaryAction;

  // When voice is on, Navi reads her current line (and re-reads it the moment
  // the attendee enables voice). `speak` de-dupes, so this won't repeat itself.
  const { enabled, speak } = useNaviVoice();
  useEffect(() => {
    if (enabled) speak(message);
  }, [enabled, message, speak]);

  return (
    <section className="flex flex-col items-center text-center">
      <AvatarHost mood={script.mood} className="size-32 sm:size-36" />

      {/* Host attribution */}
      <div className="mt-3 inline-flex items-center gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-muted-foreground">
          {AVATAR_NAME} · your event host
        </span>
      </div>

      {/* Speech bubble */}
      <div className="relative mt-4 w-full">
        <div
          aria-hidden
          className="glass absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-border/60"
        />
        <div className="glass relative rounded-2xl border border-border/60 px-5 py-4 shadow-soft">
          <p className="text-sm font-semibold text-brand-blue">
            {script.greeting}
          </p>
          <p className="mt-1.5 text-pretty text-lg font-medium leading-snug text-foreground">
            {message}
          </p>
        </div>
      </div>

      {/* Next action(s) */}
      {primary || secondary ? (
        <div className="mt-5 flex w-full flex-col gap-2.5 sm:flex-row sm:justify-center">
          {primary ? (
            <Button
              asChild
              size="lg"
              className={cn(
                "bg-brand-gradient h-12 rounded-xl border-0 px-6 text-base font-semibold text-white shadow-soft transition",
                "hover:brightness-105 hover:shadow-soft-lg active:brightness-95",
              )}
            >
              <Link href={primary.href}>
                {primary.label}
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : null}
          {secondary ? (
            <Button
              asChild
              size="lg"
              variant={
                primary?.intent === ActionIntent.Primary ? "outline" : "default"
              }
              className="h-12 rounded-xl px-6 text-base font-medium"
            >
              <Link href={secondary.href}>{secondary.label}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
