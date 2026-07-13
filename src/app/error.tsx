"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { AvatarMood } from "@/constants/statuses";
import { AVATAR_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";

/**
 * Route error boundary (Phase 6). A render/runtime error in any screen shows
 * this Navi-styled recovery card with a retry, instead of white-screening the
 * whole app. `reset()` re-renders the failed segment.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error boundary]", error);
  }, [error]);

  return (
    <div className="bg-app-ambient flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <AvatarHost mood={AvatarMood.Relaxed} className="size-24 animate-float" />
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-brand-blue">Something went sideways</p>
        <h1 className="text-2xl font-bold">Give {AVATAR_NAME} a moment</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          A hiccup interrupted this screen. Try again — if it keeps happening,
          reopen the app.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={reset} className="bg-brand-gradient border-0 text-white hover:brightness-105">
          <RotateCw className="size-4" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href={ROUTES.HOME}>
            <Home className="size-4" />
            Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
