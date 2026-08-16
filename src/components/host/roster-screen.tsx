"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Armchair,
  CircleCheck,
  ClipboardList,
  Database,
  Download,
  ListPlus,
  RefreshCw,
  Search,
  TriangleAlert,
  Upload,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { toast } from "sonner";
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
import { LectureTheatreMap, MapLegend } from "@/components/seating/lecture-theatre-map";
import {
  ATTENDANCE_IMPORT_API_PATH,
  PRELOADED_ATTENDEES,
} from "@/constants/attendance";
import { HOST_TOKEN_HEADER } from "@/constants/host-auth";
import {
  ROSTER_API_PATH,
  ROSTER_CSV_FILENAME,
  ROSTER_REFRESH_MS,
} from "@/constants/roster";
import {
  ATTENDEE_ROLE_ORDER,
  AttendeeRole,
  MapView,
  VENUE_DETAIL,
} from "@/constants/seating";
import { formatScore, getInitials } from "@/utils/format";
import { downloadCsv } from "@/utils/csv";
import { duplicateSeatIds, parseAttendanceCsv, roleLabel } from "@/utils/attendance";
import { getStoredHostToken } from "@/utils/host-auth";
import { SEATS_BY_ROW } from "@/utils/seats";
import {
  filterRoster,
  formatGoalsLabel,
  formatRosterTime,
  formatSeatLabel,
  rosterToCsv,
  summarizeRoster,
} from "@/utils/roster";
import { cn } from "@/lib/utils";
import type { AttendanceImportRow, RosterEntry, RosterResponse } from "@/types";

/**
 * Host roster / attendance screen: the event's attendance list. Every attendee
 * with their live online status, check-in mark, best game score — and the two
 * things the Lecture Theatre event needs: the **seat** they're assigned to and
 * the **role** they're tagged as (Staff / Supervisor / HOD / Guest).
 *
 * Seats can be changed either from the per-row picker or by selecting an
 * attendee and clicking a seat on the plan. Every edit persists to Postgres, so
 * the attendee's phone shows the new seat — no per-device state.
 */
export function RosterScreen() {
  const [response, setResponse] = useState<RosterResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

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

  const roster = useMemo(() => response?.roster ?? [], [response]);
  const visible = filterRoster(roster, query);
  const summary = summarizeRoster(roster);
  const loading = response === null && !failed;

  const assignedSeatIds = useMemo(
    () =>
      new Set(
        roster.map((entry) => entry.seat?.seatId).filter((id): id is string => Boolean(id)),
      ),
    [roster],
  );
  const duplicates = useMemo(() => duplicateSeatIds(roster), [roster]);
  const selected = roster.find((entry) => entry.id === selectedId) ?? null;

  /** Persist a seat / role change for one attendee, then refresh the list. */
  const patchAttendee = useCallback(
    async (id: string, patch: { seatId?: string | null; role?: AttendeeRole }) => {
      setBusy(true);
      try {
        const res = await fetch(`${ROSTER_API_PATH}/${id}`, {
          method: "PATCH",
          headers: hostHeaders(),
          body: JSON.stringify(patch),
        });
        const payload = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          toast.error(payload?.error ?? "Couldn't save that change");
          return;
        }
        await load();
      } catch {
        toast.error("Couldn't reach the event server");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const importRows = useCallback(
    async (rows: readonly AttendanceImportRow[], source: string) => {
      if (rows.length === 0) {
        toast.error(`No usable rows in ${source}`);
        return;
      }
      setBusy(true);
      try {
        const res = await fetch(ATTENDANCE_IMPORT_API_PATH, {
          method: "POST",
          headers: hostHeaders(),
          body: JSON.stringify({ rows }),
        });
        const payload = (await res.json().catch(() => null)) as {
          error?: string;
          imported?: number;
          skipped?: string[];
        } | null;
        if (!res.ok) {
          toast.error(payload?.error ?? "Import failed");
          return;
        }
        toast.success(`Imported ${payload?.imported ?? 0} attendees from ${source}`);
        if (payload?.skipped?.length) {
          toast.warning(
            `${payload.skipped.length} skipped — ${payload.skipped.slice(0, 3).join("; ")}`,
          );
        }
        await load();
      } catch {
        toast.error("Couldn't reach the event server");
      } finally {
        setBusy(false);
      }
    },
    [load],
  );

  const onCsvPicked = useCallback(
    async (file: File) => {
      const { rows, errors } = parseAttendanceCsv(await file.text());
      if (errors.length > 0) {
        toast.warning(`${errors.length} row(s) skipped — ${errors.slice(0, 2).join("; ")}`);
      }
      await importRows(rows, file.name);
    },
    [importRows],
  );

  return (
    <div className="flex min-w-0 flex-col gap-4 px-5 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Attendee roster</h1>
          <p className="text-sm text-muted-foreground">
            Attendance, {VENUE_DETAIL} seats, and best game scores — in one list.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            variant="outline"
            size="sm"
            onClick={() => void importRows(PRELOADED_ATTENDEES, "the IHH list")}
            disabled={busy}
          >
            <ListPlus className="size-4" />
            Load IHH list
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInput.current?.click()}
            disabled={busy}
          >
            <Upload className="size-4" />
            Import CSV
          </Button>
          <Button
            size="sm"
            onClick={() => downloadCsv(ROSTER_CSV_FILENAME, rosterToCsv(roster))}
            disabled={roster.length === 0}
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void onCsvPicked(file);
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="On the list" value={summary.registered} />
        <StatCard icon={UserCheck} label="Checked in" value={summary.checkedIn} />
        <StatCard icon={Wifi} label="Online now" value={summary.online} live />
        <StatCard icon={Armchair} label="Seats assigned" value={summary.seated} />
      </div>

      {duplicates.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning-foreground" />
          <p className="text-xs text-warning-foreground">
            Two attendees share {duplicates.length === 1 ? "seat" : "seats"}{" "}
            {duplicates.join(", ")}. Reassign one of them before the doors open.
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="size-4 text-brand-blue" />
            All attendees
          </CardTitle>
          <CardDescription>
            Check-in stamps automatically the first time an attendee opens the
            event app. Change a seat or role here and their phone follows.
          </CardDescription>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email or seat…"
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
              title="Nobody on the list yet"
              detail="Load the IHH list or import a CSV — attendees also appear the moment they register."
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
              <table className="w-full min-w-[52rem] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-2 py-2 font-medium">Attendee</th>
                    <th className="px-2 py-2 font-medium">Seat</th>
                    <th className="px-2 py-2 font-medium">Role</th>
                    <th className="px-2 py-2 font-medium">Learning goals</th>
                    <th className="px-2 py-2 font-medium">Attendance</th>
                    <th className="px-2 py-2 text-right font-medium">Best score</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((entry) => (
                    <RosterRow
                      key={entry.id}
                      entry={entry}
                      selected={entry.id === selectedId}
                      busy={busy}
                      takenSeatIds={assignedSeatIds}
                      onSelect={() =>
                        setSelectedId((current) => (current === entry.id ? null : entry.id))
                      }
                      onChange={(patch) => void patchAttendee(entry.id, patch)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Armchair className="size-4 text-brand-blue" />
            {VENUE_DETAIL} plan
          </CardTitle>
          <CardDescription>
            {selected
              ? `Click a seat to move ${selected.name} there.`
              : "Pick an attendee in the list above, then click their seat on the plan."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="overflow-hidden rounded-2xl">
            <LectureTheatreMap
              highlightSeatId={selected?.seat?.seatId}
              assignedSeatIds={assignedSeatIds}
              view={MapView.Full}
              calloutLabel={selected ? firstNameOf(selected.name) : "Selected"}
              onSelectSeat={
                selected && !busy
                  ? (seatId) => void patchAttendee(selected.id, { seatId })
                  : undefined
              }
            />
          </div>
          <MapLegend mineLabel={selected ? `${firstNameOf(selected.name)}'s seat` : "Selected"} />
        </CardContent>
      </Card>
    </div>
  );
}

/** Host passcode goes on every write, exactly like the realtime publish path. */
function hostHeaders(): HeadersInit {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const token = getStoredHostToken();
  if (token) headers[HOST_TOKEN_HEADER] = token;
  return headers;
}

function firstNameOf(name: string): string {
  return name.split(" ")[0] ?? name;
}

function RosterRow({
  entry,
  selected,
  busy,
  takenSeatIds,
  onSelect,
  onChange,
}: {
  entry: RosterEntry;
  selected: boolean;
  busy: boolean;
  takenSeatIds: ReadonlySet<string>;
  onSelect: () => void;
  onChange: (patch: { seatId?: string | null; role?: AttendeeRole }) => void;
}) {
  const goals = formatGoalsLabel(entry.goals);
  const seatId = entry.seat?.seatId ?? "";

  return (
    <tr
      className={cn(
        "border-b border-border/60 last:border-0",
        selected && "bg-brand-blue/5",
      )}
    >
      <td className="px-2 py-2.5">
        <button
          type="button"
          onClick={onSelect}
          className="flex w-full items-center gap-2.5 text-left"
          aria-pressed={selected}
        >
          <div className="relative">
            <Avatar className="size-8">
              <AvatarFallback
                className={cn(
                  "text-[11px] font-semibold",
                  selected ? "bg-brand-blue text-white" : "bg-muted",
                )}
              >
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
        </button>
      </td>

      <td className="whitespace-nowrap px-2 py-2.5">
        <select
          value={seatId}
          disabled={busy}
          onChange={(event) => onChange({ seatId: event.target.value || null })}
          aria-label={`Seat for ${entry.name}`}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
        >
          <option value="">Unassigned</option>
          {SEATS_BY_ROW.map(({ row, seats }) => (
            <optgroup key={row} label={`Row ${row}`}>
              {seats
                .filter((seat) => !seat.isBlocked)
                .map((seat) => (
                  <option key={seat.id} value={seat.id}>
                    {seat.id}
                    {takenSeatIds.has(seat.id) && seat.id !== seatId ? " · taken" : ""}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
        <span className="sr-only">{formatSeatLabel(entry.seat)}</span>
      </td>

      <td className="whitespace-nowrap px-2 py-2.5">
        <select
          value={entry.role}
          disabled={busy}
          onChange={(event) => onChange({ role: event.target.value as AttendeeRole })}
          aria-label={`Role for ${entry.name}`}
          className="h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:opacity-60"
        >
          {ATTENDEE_ROLE_ORDER.map((role) => (
            <option key={role} value={role}>
              {roleLabel(role)}
            </option>
          ))}
        </select>
      </td>

      <td className="max-w-[14rem] px-2 py-2.5">
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
            Not yet
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
