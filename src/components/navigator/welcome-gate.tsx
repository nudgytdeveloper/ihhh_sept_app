"use client";

import { useState } from "react";
import { ArrowRight, Armchair, Sparkles } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_NAME, EVENT_NAME } from "@/constants/app";
import { AvatarMood } from "@/constants/statuses";
import { completeOnboarding, usePlayerIdentity } from "@/utils/player-identity";

/** Longest name we accept at the welcome step. */
const NAME_MAX = 24;

/**
 * The first thing a new attendee sees: Navi welcomes them, shows the seat that's
 * been auto-allocated, and asks for their name. Submitting completes onboarding —
 * the entered name + seat then drive the navigator and the shared leaderboard.
 * The avatar leads (no chat box), in keeping with the product direction.
 */
export function WelcomeGate() {
  const identity = usePlayerIdentity();
  const [name, setName] = useState("");

  const { seat } = identity;
  const seatValue = [seat.table, seat.seat].filter(Boolean).join(" · ");
  const canSubmit = name.trim().length > 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    completeOnboarding(name);
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 text-center">
      <AvatarHost mood={AvatarMood.Welcoming} className="size-28 sm:size-32" />

      <div className="mt-3 inline-flex items-center gap-1.5">
        <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
        <span className="text-xs font-medium text-muted-foreground">
          {AVATAR_NAME} · your event host
        </span>
      </div>

      {/* Speech bubble */}
      <div className="relative mt-4 w-full max-w-sm">
        <div
          aria-hidden
          className="glass absolute -top-2 left-1/2 size-4 -translate-x-1/2 rotate-45 rounded-[3px] border-l border-t border-border/60"
        />
        <div className="glass relative rounded-2xl border border-border/60 px-5 py-4 shadow-soft">
          <p className="text-sm font-semibold text-brand-blue">
            Welcome to {EVENT_NAME} 👋
          </p>
          <p className="mt-1.5 text-pretty text-lg font-medium leading-snug text-foreground">
            So glad you&apos;re here! I&apos;ve saved you a seat — what should I
            call you?
          </p>
        </div>
      </div>

      {/* Auto-allocated seat */}
      <Card className="mt-4 w-full max-w-sm flex-row items-center gap-3 rounded-2xl border-border/60 p-3 text-left shadow-soft">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-blue/10 text-brand-blue">
          <Armchair className="size-5" />
        </div>
        <div className="min-w-0 leading-tight">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Your seat · auto-allocated
          </p>
          <p className="text-sm font-semibold">{seatValue}</p>
          {seat.zone ? (
            <p className="text-xs text-muted-foreground">{seat.zone}</p>
          ) : null}
        </div>
        <Sparkles className="ml-auto size-4 shrink-0 text-brand-purple" />
      </Card>

      {/* Name entry */}
      <form onSubmit={handleSubmit} className="mt-4 w-full max-w-sm">
        <label htmlFor="attendee-name" className="sr-only">
          Your name
        </label>
        <input
          id="attendee-name"
          type="text"
          autoComplete="given-name"
          maxLength={NAME_MAX}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Enter your name"
          className={cn(
            "h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-center text-base font-medium shadow-soft outline-none transition",
            "placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/30",
          )}
        />
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="bg-brand-gradient mt-3 h-12 w-full rounded-xl border-0 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
        >
          Enter the event
          <ArrowRight className="size-4" />
        </Button>
      </form>

      <p className="mt-3 max-w-xs text-xs text-muted-foreground">
        {AVATAR_NAME} will guide you through the day, one step at a time.
      </p>
    </div>
  );
}
