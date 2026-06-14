"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NaviHost } from "@/components/navigator/navi-host";
import { NaviTips } from "@/components/navigator/navi-tips";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ActionIntent } from "@/constants/statuses";
import type { AvatarScript } from "@/constants/avatar-scripts";

/**
 * The hero of the navigator: the interactive avatar host (NaviHost) speaks first
 * and reacts to taps + the live event, then offers a single clear next action
 * and a rotating tip — never a chat box.
 */
export function NavigatorHero({
  script,
  name,
}: {
  script: AvatarScript;
  name: string;
}) {
  const primary = script.action;
  const secondary = script.secondaryAction;

  return (
    <section className="flex flex-col items-center text-center">
      <NaviHost script={script} name={name} />

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

      {/* Navi's rotating, phase-aware tips */}
      <div className="mt-4 w-full">
        <NaviTips name={name} />
      </div>
    </section>
  );
}
