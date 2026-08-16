import {
  BLOCKED_SEAT_IDS,
  CENTRE_ROW_COUNT,
  PLAN_CENTRE_X,
  SEAT_PITCH,
  SEAT_ROW_SPECS,
  SEAT_SIZE,
  SeatBlock,
  SeatRow,
  SeatZone,
  VENUE_DETAIL,
} from "@/constants/seating";
import { SeatStatus } from "@/constants/statuses";
import type { SeatInfo } from "@/types";

/**
 * Seat plan helpers. `SEAT_ROW_SPECS` (geometry) is expanded here into concrete
 * seats — the single source for the SVG map, the seat picker, the auto
 * allocation, and the walking directions. Client-safe (also used server-side by
 * the registration route).
 */

export interface Seat {
  /** Row letter + number, e.g. "H3". */
  id: string;
  row: SeatRow;
  number: number;
  /** 0-based position within its own run of seats. */
  indexInRun: number;
  runCount: number;
  block: SeatBlock;
  zone: SeatZone;
  rowFromFront: number;
  /** Top-left corner on the plan canvas. */
  x: number;
  y: number;
  centreX: number;
  centreY: number;
  isBlocked: boolean;
}

function buildSeats(): Seat[] {
  const seats: Seat[] = [];

  for (const spec of SEAT_ROW_SPECS) {
    for (let i = 0; i < spec.count; i++) {
      const number = spec.firstNumber + i;
      const id = `${spec.row}${number}`;
      const centreX =
        spec.centreX !== undefined
          ? spec.centreX + (i - (spec.count - 1) / 2) * SEAT_PITCH
          : (spec.startX ?? 0) + i * SEAT_PITCH;

      seats.push({
        id,
        row: spec.row,
        number,
        indexInRun: i,
        runCount: spec.count,
        block: spec.block,
        zone: spec.zone,
        rowFromFront: spec.rowFromFront,
        x: centreX - SEAT_SIZE / 2,
        y: spec.y - SEAT_SIZE / 2,
        centreX,
        centreY: spec.y,
        isBlocked: BLOCKED_SEAT_IDS.includes(id),
      });
    }
  }

  return seats;
}

export const SEATS: readonly Seat[] = buildSeats();

export const SEAT_BY_ID: Readonly<Record<string, Seat>> = SEATS.reduce<
  Record<string, Seat>
>((acc, seat) => {
  acc[seat.id] = seat;
  return acc;
}, {});

/** Every seat that can be tagged to an attendee (blocked seats excluded). */
export const SELECTABLE_SEAT_IDS: readonly string[] = SEATS.filter(
  (seat) => !seat.isBlocked,
).map((seat) => seat.id);

/** Seats grouped by row letter — drives the grouped seat picker in the host console. */
export const SEATS_BY_ROW: ReadonlyArray<{ row: SeatRow; seats: Seat[] }> =
  Object.values(SeatRow).map((row) => ({
    row,
    seats: SEATS.filter((seat) => seat.row === row).sort(
      (a, b) => a.number - b.number,
    ),
  }));

/**
 * Order walk-in attendees are auto-allocated in: the back of the centre block
 * first, then the side blocks, so the front rows stay free for the seats IHH
 * has designated on the attendance list.
 */
export const AUTO_ALLOCATION_ORDER: readonly string[] = [
  ...[...SEATS]
    .filter((seat) => !seat.isBlocked && seat.block === SeatBlock.Centre)
    .sort((a, b) => b.rowFromFront - a.rowFromFront || a.number - b.number)
    .map((seat) => seat.id),
  ...SEATS.filter((seat) => !seat.isBlocked && seat.block !== SeatBlock.Centre).map(
    (seat) => seat.id,
  ),
];

export function normalizeSeatId(seatId: string): string {
  return seatId.trim().toUpperCase().replace(/\s+/g, "");
}

export function getSeat(seatId: string | null | undefined): Seat | undefined {
  if (!seatId) return undefined;
  return SEAT_BY_ID[normalizeSeatId(seatId)];
}

/** True when the id names a real seat that isn't crossed out on the plan. */
export function isAssignableSeatId(seatId: string): boolean {
  const seat = getSeat(seatId);
  return seat !== undefined && !seat.isBlocked;
}

/**
 * The first unoccupied seat in `AUTO_ALLOCATION_ORDER`, or null when the
 * theatre is full (the caller then leaves the attendee unassigned for the host
 * to place by hand).
 */
export function nextFreeSeatId(taken: Iterable<string>): string | null {
  const used = new Set<string>();
  for (const id of taken) {
    if (id) used.add(normalizeSeatId(id));
  }
  return AUTO_ALLOCATION_ORDER.find((id) => !used.has(id)) ?? null;
}

/** The `SeatInfo` stored on an attendee for a given seat id. */
export function seatInfoFor(seatId: string | null | undefined): SeatInfo {
  const seat = getSeat(seatId);
  if (!seat) return { status: SeatStatus.Unassigned };
  return {
    status: SeatStatus.Ready,
    seatId: seat.id,
    row: seat.row,
    block: seat.block,
  };
}

/** "Row H · Seat H3", or "" when the attendee has no lecture-theatre seat. */
export function seatLabel(seat: SeatInfo | null | undefined): string {
  const resolved = getSeat(seat?.seatId);
  if (resolved) return `Row ${resolved.row} · Seat ${resolved.id}`;
  // Rows registered before the seat map still carry the old banquet fields.
  if (!seat) return "";
  return [seat.zone, seat.table, seat.seat].filter(Boolean).join(" · ");
}

export function blockLabel(block: SeatBlock): string {
  if (block === SeatBlock.Left) return "left side block";
  if (block === SeatBlock.Right) return "right side block";
  return "centre block";
}

export function ordinal(n: number): string {
  const suffix =
    n % 100 >= 11 && n % 100 <= 13
      ? "th"
      : n % 10 === 1
        ? "st"
        : n % 10 === 2
          ? "nd"
          : n % 10 === 3
            ? "rd"
            : "th";
  return `${n}${suffix}`;
}

export interface SeatDirection {
  instruction: string;
  detail: string;
}

/**
 * Walking directions from the Lecture Theatre entrance (front-left on the
 * supplied plan) to a seat. Derived from the plan geometry — nothing is
 * hardcoded per attendee, so re-tagging a seat updates the directions too.
 */
export function buildSeatDirections(seat: Seat): SeatDirection[] {
  const steps: SeatDirection[] = [
    {
      instruction: `Enter the ${VENUE_DETAIL}`,
      detail: "Main door on the front-left, past the Cert Table",
    },
  ];

  if (seat.block === SeatBlock.Centre) {
    steps.push({
      instruction: `Walk to Row ${seat.row}`,
      detail: `${ordinal(seat.rowFromFront)} row from the front, centre block (${CENTRE_ROW_COUNT} rows in total)`,
    });
  } else {
    steps.push({
      instruction: `Head to the ${seat.block === SeatBlock.Left ? "left" : "right"} side block`,
      detail: `Row ${seat.row}, beside the centre seating`,
    });
  }

  const fromLeft = seat.indexInRun + 1;
  const fromRight = seat.runCount - seat.indexInRun;
  const side =
    fromLeft <= fromRight
      ? `${ordinal(fromLeft)} seat from the left`
      : `${ordinal(fromRight)} seat from the right`;

  steps.push({
    instruction: `Seat ${seat.id}`,
    detail: `${side} of ${blockLabel(seat.block)}`,
  });

  return steps;
}

/**
 * Distance of a seat from the plan centre line, normalised to -1…1 — used to
 * nudge the map callout so it never runs off the edge.
 */
export function horizontalBias(seat: Seat): number {
  return (seat.centreX - PLAN_CENTRE_X) / PLAN_CENTRE_X;
}
