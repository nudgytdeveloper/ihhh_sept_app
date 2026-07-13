"use client";

import { useCallback, useEffect, useState } from "react";
import {
  CircleCheck,
  ClipboardList,
  Database,
  Download,
  Gamepad2,
  RefreshCw,
  Search,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ROSTER_API_PATH,
  ROSTER_CSV_FILENAME,
  ROSTER_REFRESH_MS,
} from "@/constants/roster";
import { formatScore, getInitials } from "@/utils/format";
import { downloadCsv } from "@/utils/csv";
import {
  filterRoster,
  formatGoalsLabel,
  formatRosterTime,
  formatSeatLabel,
  rosterToCsv,
  summarizeRoster,
} from "@/utils/roster";
import { cn } from "@/lib/utils";
import type { RosterEntry, RosterResponse } from "@/types";

/**
 * Host roster / attendance screen: every registered attendee with their live
 * online status, check-in mark (stamped on first connection), and persisted
 * best game score. Auto-refreshes and exports as CSV — the Nov-event
 * attendance list.
 */
export function RosterScreen() {
  const [response, setResponse] = useState<RosterResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await fetch(ROSTER_API_PATH, { cache: "no-store" });
      if (!res.ok) throw new Error(`roster fetch failed (${res.status})`);
      setResponse((await res.json()) as RosterResponse);
      setFailed(false);
    } catch {
      setFailed(true);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // First fetch runs from a timer callback (never setState in an effect body).
    const initial = setTimeout(() => void load(), 0);
    const timer = setInterval(() => void load(), ROSTER_REFRESH_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [load]);

  const roster = response?.roster ?? [];
  const visible = filterRoster(roster, query);
  const summary = summarizeRoster(roster);
  const loading = response === null && !failed;

  return (
    <div className="flex min-w-0 flex-col gap-4 px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Attendee roster</h1>
          <p className="text-sm text-muted-foreground">
            Registration, live attendance, and best game scores — in one list.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setRefreshing(true);
              void load();
            }}
            disabled={loading || refreshing}
          >
            <RefreshCw className={cn("size-4", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => downloadCsv(ROSTER_CSV_FILENAME, rosterToCsv(roster))}
            disabled={roster.length === 0}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Registered" value={summary.registered} />
        <StatCard icon={UserCheck} label="Checked in" value={summary.checkedIn} />
        <StatCard icon={Wifi} label="Online now" value={summary.online} live />
        <StatCard icon={Gamepad2} label="Played" value={summary.played} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-brand-blue" />
            All attendees
          </CardTitle>
          <CardDescription>
            Check-in stamps automatically the first time an attendee opens the
            event app; scores persist across rounds.
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email…"
              className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </CardHeader>
        <CardContent className="min-w-0">
          {loading ? <RosterSkeleton /> : null}
          {failed && response === null ? (
            <EmptyState
              icon={RefreshCw}
              title="Couldn't load the roster"
              detail="The event server didn't respond — try a refresh."
            />
          ) : null}
          {response && !response.available ? (
            <EmptyState
              icon={Database}
              title="No database configured"
              detail="Set DATABASE_URL to persist registrations and enable the roster."
            />
          ) : null}
          {response?.available && roster.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No registrations yet"
              detail="Attendees appear here the moment they complete the welcome step."
            />
          ) : null}
          {response?.available && roster.length > 0 && visible.length === 0 ? (
            <EmptyState
              icon={Search}
              title="No matches"
              detail={`Nobody matches "${query.trim()}".`}
            />
          ) : null}

          {visible.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Attendee</th>
                    <th className="px-2 py-2 font-medium">Seat</th>
                    <th className="px-2 py-2 font-medium">Learning goals</th>
                    <th className="px-2 py-2 font-medium">Attendance</th>
                    <th className="px-2 py-2 text-right font-medium">Best score</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => (
                    <RosterRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function RosterRow({ entry }: { entry: RosterEntry }) {
  const goals = formatGoalsLabel(entry.goals);
  const seat = formatSeatLabel(entry.seat);
  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-2 py-2.5">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar className="size-8">
              <AvatarFallback className="bg-muted text-[11px] font-semibold">
                {getInitials(entry.name)}
              </AvatarFallback>
            </Avatar>
            {entry.online ? (
              <span
                className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-card bg-emerald-500"
                title="Online now"
              />
            ) : null}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate font-medium">{entry.name}</p>
            <p className="truncate text-xs text-muted-foreground">{entry.email}</p>
          </div>
        </div>
      </td>
      <td className="whitespace-nowrap px-2 py-2.5 text-xs text-muted-foreground">
        {seat || "—"}
      </td>
      <td className="max-w-[16rem] px-2 py-2.5">
        <p className="truncate text-xs text-muted-foreground" title={goals}>
          {goals || "—"}
        </p>
      </td>
      <td className="whitespace-nowrap px-2 py-2.5">
        {entry.checkedInAt ? (
          <Badge variant="outline" className="gap-1 border-emerald-500/40 text-emerald-600">
            <CircleCheck className="size-3" />
            {formatRosterTime(entry.checkedInAt)}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-muted-foreground">
            Registered
          </Badge>
        )}
      </td>
      <td className="px-2 py-2.5 text-right font-mono font-semibold tabular-nums">
        {entry.score !== null ? formatScore(entry.score) : "—"}
      </td>
    </tr>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  live = false,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  live?: boolean;
}) {
  return (
    <Card className="gap-1 py-4">
      <CardContent className="flex items-center gap-3 px-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-blue/10 text-brand-blue">
          <Icon className="size-4.5" />
        </div>
        <div className="leading-tight">
          <p className="font-mono text-lg font-bold tabular-nums">
            {value}
            {live && value > 0 ? (
              <span className="ml-1.5 inline-block size-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" />
            ) : null}
          </p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  detail,
}: {
  icon: typeof Users;
  title: string;
  detail: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 py-10 text-center">
      <Icon className="size-7 text-muted-foreground/50" />
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-[18rem] text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function RosterSkeleton() {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="size-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}
