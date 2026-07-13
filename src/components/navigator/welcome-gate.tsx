"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRight, Armchair, Check, Loader2, Sparkles } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AVATAR_NAME, EVENT_NAME } from "@/constants/app";
import {
  LEARNING_GOAL_PRESETS,
  REGISTRATION_LIMITS,
  RegistrationStep,
} from "@/constants/registration";
import { AvatarMood } from "@/constants/statuses";
import { completeRegistration, usePlayerIdentity } from "@/utils/player-identity";
import {
  buildLearningGoals,
  hasAnyGoal,
  isValidEmail,
  toggleGoal,
} from "@/utils/registration";

/**
 * The first thing a new attendee sees: Navi welcomes them, shows the seat that's
 * been auto-allocated, and registers them in two quick steps — name + corporate
 * email, then their learning goals for the day (which later drive the
 * personalized AI session summaries). Submitting registers the attendee
 * server-side (`/api/register`) and completes onboarding. The avatar leads (no
 * chat box), in keeping with the product direction.
 */
export function WelcomeGate() {
  const identity = usePlayerIdentity();
  const [step, setStep] = useState<RegistrationStep>(RegistrationStep.Details);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [customGoal, setCustomGoal] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { seat } = identity;
  const seatValue = [seat.table, seat.seat].filter(Boolean).join(" · ");
  const firstName = name.trim().split(/\s+/)[0];

  const canContinue = name.trim().length > 0 && isValidEmail(email);
  const goals = buildLearningGoals(selectedGoals, customGoal);
  const canEnter = hasAnyGoal(goals) && !submitting;

  function handleContinue(event: React.FormEvent) {
    event.preventDefault();
    if (!canContinue) return;
    setStep(RegistrationStep.Goals);
  }

  async function handleEnter(event: React.FormEvent) {
    event.preventDefault();
    if (!canEnter) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeRegistration({ name, email, goals });
    } catch {
      setError("Couldn't reach the event server — please try again.");
      setSubmitting(false);
    }
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
          {step === RegistrationStep.Details ? (
            <>
              <p className="text-sm font-semibold text-brand-blue">
                Welcome to {EVENT_NAME} 👋
              </p>
              <p className="mt-1.5 text-pretty text-lg font-medium leading-snug text-foreground">
                So glad you&apos;re here! I&apos;ve saved you a seat — let&apos;s
                get you registered.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-brand-blue">
                Lovely to meet you{firstName ? `, ${firstName}` : ""} ✨
              </p>
              <p className="mt-1.5 text-pretty text-lg font-medium leading-snug text-foreground">
                What would you like to get out of today? I&apos;ll tailor your
                session summaries to it.
              </p>
            </>
          )}
        </div>
      </div>

      {step === RegistrationStep.Details ? (
        <>
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

          {/* Name + corporate email */}
          <form onSubmit={handleContinue} className="mt-4 w-full max-w-sm">
            <label htmlFor="attendee-name" className="sr-only">
              Your name
            </label>
            <input
              id="attendee-name"
              type="text"
              autoComplete="given-name"
              maxLength={REGISTRATION_LIMITS.nameMax}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Enter your name"
              className={inputClass}
            />
            <label htmlFor="attendee-email" className="sr-only">
              Corporate email
            </label>
            <input
              id="attendee-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              maxLength={REGISTRATION_LIMITS.emailMax}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your corporate email"
              className={cn(inputClass, "mt-2.5")}
            />
            <Button
              type="submit"
              size="lg"
              disabled={!canContinue}
              className="bg-brand-gradient mt-3 h-12 w-full rounded-xl border-0 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          </form>
        </>
      ) : (
        /* Learning goals */
        <form onSubmit={handleEnter} className="mt-4 w-full max-w-sm">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Pick up to {REGISTRATION_LIMITS.maxGoals} · or type your own
          </p>
          <div className="mt-2.5 flex flex-wrap justify-center gap-2">
            {LEARNING_GOAL_PRESETS.map((goal) => {
              const selected = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSelectedGoals((prev) => toggleGoal(prev, goal))}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium shadow-soft transition",
                    selected
                      ? "border-transparent bg-brand-blue text-white"
                      : "border-border/70 bg-background text-foreground hover:border-brand-blue/40 hover:text-brand-blue",
                  )}
                >
                  {selected ? <Check className="size-3.5" /> : null}
                  {goal}
                </button>
              );
            })}
          </div>
          <label htmlFor="attendee-goal" className="sr-only">
            Your own learning goal
          </label>
          <input
            id="attendee-goal"
            type="text"
            maxLength={REGISTRATION_LIMITS.customGoalMax}
            value={customGoal}
            onChange={(event) => setCustomGoal(event.target.value)}
            placeholder="Or type your own goal…"
            className={cn(inputClass, "mt-3")}
          />
          {error ? (
            <p role="alert" className="mt-2.5 text-sm font-medium text-destructive">
              {error}
            </p>
          ) : null}
          <Button
            type="submit"
            size="lg"
            disabled={!canEnter}
            className="bg-brand-gradient mt-3 h-12 w-full rounded-xl border-0 text-base font-semibold text-white shadow-soft transition hover:brightness-105 hover:shadow-soft-lg active:brightness-95"
          >
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Registering…
              </>
            ) : (
              <>
                Enter the event
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
          <button
            type="button"
            onClick={() => setStep(RegistrationStep.Details)}
            disabled={submitting}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-3" />
            Back to my details
          </button>
        </form>
      )}

      <p className="mt-3 max-w-xs text-xs text-muted-foreground">
        {AVATAR_NAME} will guide you through the day, one step at a time.
      </p>
    </div>
  );
}

/** Shared input styling for the welcome fields (matches the original name box). */
const inputClass = cn(
  "h-12 w-full rounded-xl border border-border/70 bg-background px-4 text-center text-base font-medium shadow-soft outline-none transition",
  "placeholder:font-normal placeholder:text-muted-foreground focus-visible:border-brand-blue focus-visible:ring-2 focus-visible:ring-brand-blue/30",
);
