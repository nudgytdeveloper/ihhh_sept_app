"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Mic, SlidersHorizontal } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: ROUTES.HOST, label: "Control panel", icon: SlidersHorizontal },
  { href: ROUTES.HOST_ROSTER, label: "Roster", icon: ClipboardList },
  { href: ROUTES.HOST_SESSIONS, label: "Sessions", icon: Mic },
] as const;

/** Header tabs switching between the host's control panel and the roster. */
export function HostNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 rounded-lg bg-secondary p-1">
      {LINKS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
              active
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
