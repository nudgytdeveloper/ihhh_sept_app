import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

/**
 * Placeholder shown on screens that are scaffolded but not yet built.
 * Keeps routing/theme verifiable and offers quick navigation between the
 * 5 demo screens during development.
 */

const SCREEN_LINKS = [
  { label: "Home", href: ROUTES.HOME },
  { label: "Schedule", href: ROUTES.SCHEDULE },
  { label: "Game Lobby", href: ROUTES.GAME_LOBBY },
  { label: "Virus Fight", href: ROUTES.GAME_PLAY },
  { label: "Host Panel", href: ROUTES.HOST },
];

interface ScreenStubProps {
  eyebrow?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient stops, e.g. "from-blue-500 to-indigo-500". */
  gradient?: string;
  currentHref?: string;
}

export function ScreenStub({
  eyebrow,
  title,
  description,
  icon: Icon,
  gradient = "from-blue-500 to-indigo-500",
  currentHref,
}: ScreenStubProps) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-6 px-5 py-14 text-center">
      <div
        className={cn(
          "flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br text-white shadow-soft-lg",
          gradient,
        )}
      >
        <Icon className="size-9" strokeWidth={1.75} />
      </div>

      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-sm font-medium text-muted-foreground">{eyebrow}</p>
        ) : null}
        <h1 className="text-pretty text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-pretty text-muted-foreground">{description}</p>
      </div>

      <Badge variant="secondary" className="gap-1.5 rounded-full">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Scaffolded — UI in progress
      </Badge>

      <div className="w-full space-y-2 pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Jump to a screen
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {SCREEN_LINKS.map((link) => (
            <Button
              key={link.href}
              asChild
              size="sm"
              variant={link.href === currentHref ? "default" : "outline"}
              className="rounded-full"
            >
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
