import Link from "next/link";
import { Home } from "lucide-react";
import { AvatarHost } from "@/components/navigator/avatar-host";
import { AvatarMood } from "@/constants/statuses";
import { AVATAR_NAME } from "@/constants/app";
import { ROUTES } from "@/constants/routes";

/** 404 page (Phase 6) — Navi-styled, points back to the navigator home. */
export default function NotFound() {
  return (
    <div className="bg-app-ambient flex min-h-dvh flex-col items-center justify-center gap-6 px-6 text-center">
      <AvatarHost mood={AvatarMood.Guiding} className="size-24 animate-float" />
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-brand-blue">Page not found</p>
        <h1 className="text-2xl font-bold">You&apos;ve wandered off the map</h1>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          {AVATAR_NAME} can&apos;t find that page — let&apos;s get you back to the event.
        </p>
      </div>
      <Link
        href={ROUTES.HOME}
        className="bg-brand-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-105"
      >
        <Home className="size-4" />
        Back to the navigator
      </Link>
    </div>
  );
}
