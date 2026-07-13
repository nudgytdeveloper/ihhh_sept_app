import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { AVATAR_NAME } from "@/constants/app";

/**
 * Home entry point to the attendee's AI session recaps (Phase 4). Navi offers a
 * personalized recap of each talk — the attendee never has to ask.
 */
export function RecapsEntryCard() {
  return (
    <Link
      href={ROUTES.RECAPS}
      className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:border-brand-purple/40"
    >
      <div className="bg-brand-gradient flex size-11 shrink-0 items-center justify-center rounded-xl text-white shadow-soft">
        <Sparkles className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">Your session recaps</p>
        <p className="text-xs text-muted-foreground">
          {AVATAR_NAME} sums up each talk around your learning goals — read, tweak, share.
        </p>
      </div>
      <ChevronRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
