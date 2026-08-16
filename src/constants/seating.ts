/**
 * Lecture Theatre seating plan — the real venue layout for the IHH event
 * (Notion task 561). Coordinates mirror the floor plan supplied by IHH so the
 * on-screen map is recognisable against the printed one.
 *
 * Everything about a seat is derived from this geometry (`@/utils/seats`) —
 * seat ids, the SVG map, and the walking directions. Never hardcode a per-
 * attendee direction or a seat coordinate anywhere else.
 */

/** Row letters, front (A) to back (H), plus the J/K side blocks. */
export enum SeatRow {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  F = "F",
  G = "G",
  H = "H",
  J = "J",
  K = "K",
}

/** Which block of the theatre a run of seats belongs to. */
export enum SeatBlock {
  Centre = "centre",
  Left = "left",
  Right = "right",
}

/** Colour bands on the supplied floor plan. */
export enum SeatZone {
  /** Rows A–B — front reserved (purple on the printed plan). */
  Priority = "priority",
  /** Rows C–D and the J/K side blocks (green). */
  Standard = "standard",
  /** Rows E–H — main seating (teal). */
  General = "general",
}

export const SEAT_ZONE_LABEL: Record<SeatZone, string> = {
  [SeatZone.Priority]: "Front reserved",
  [SeatZone.Standard]: "Middle / side",
  [SeatZone.General]: "Main seating",
};

/** How one seat on the map is drawn — distinct from an attendee's `SeatStatus`. */
export enum SeatCellStatus {
  /** The seat belonging to the attendee (or selected in the host console). */
  Mine = "mine",
  /** Already tagged to another attendee. */
  Assigned = "assigned",
  Available = "available",
  /** Crossed out on the supplied plan — not usable. */
  Blocked = "blocked",
}

/** Whether the map is zoomed to one seat or showing the whole theatre. */
export enum MapView {
  Focus = "focus",
  Full = "full",
}

/** How an attendee is tagged on the attendance list. */
export enum AttendeeRole {
  Staff = "staff",
  Supervisor = "supervisor",
  Hod = "hod",
  Guest = "guest",
}

export const ATTENDEE_ROLE_LABEL: Record<AttendeeRole, string> = {
  [AttendeeRole.Staff]: "Staff",
  [AttendeeRole.Supervisor]: "Supervisor",
  [AttendeeRole.Hod]: "HOD",
  [AttendeeRole.Guest]: "Guest",
};

export const ATTENDEE_ROLE_ORDER: readonly AttendeeRole[] = [
  AttendeeRole.Staff,
  AttendeeRole.Supervisor,
  AttendeeRole.Hod,
  AttendeeRole.Guest,
] as const;

export const DEFAULT_ATTENDEE_ROLE = AttendeeRole.Staff;

/** Venue identity, shown on the seat screen + directions. */
export const VENUE_NAME = "Gleneagles Hospital";
export const VENUE_DETAIL = "Lecture Theatre";

/* ------------------------------------------------------------------ *
 * Plan geometry
 * ------------------------------------------------------------------ */

/** Drawing canvas — matches the aspect ratio of the supplied layout. */
export const PLAN_WIDTH = 1882;
export const PLAN_HEIGHT = 1291;
export const SEAT_SIZE = 48;
export const SEAT_PITCH = 69.7;
export const PLAN_CENTRE_X = 940;

/** Seats crossed out on the supplied plan (not usable). */
export const BLOCKED_SEAT_IDS: readonly string[] = ["C5", "C6"] as const;

export interface SeatRowSpec {
  row: SeatRow;
  block: SeatBlock;
  zone: SeatZone;
  /** Vertical centre of the row on the plan canvas. */
  y: number;
  count: number;
  /** Seat number of the first seat in this run (J6–J10 continue the J row). */
  firstNumber: number;
  /** Centre-aligned rows use this; the side blocks use `startX` instead. */
  centreX?: number;
  startX?: number;
  /** Row order from the front of the theatre — drives walking directions. */
  rowFromFront: number;
}

export const SEAT_ROW_SPECS: readonly SeatRowSpec[] = [
  // Side blocks, level with the front rows
  {
    row: SeatRow.J,
    block: SeatBlock.Left,
    zone: SeatZone.Standard,
    y: 465,
    count: 5,
    firstNumber: 1,
    startX: 56,
    rowFromFront: 1,
  },
  {
    row: SeatRow.J,
    block: SeatBlock.Right,
    zone: SeatZone.Standard,
    y: 465,
    count: 5,
    firstNumber: 6,
    startX: 1547,
    rowFromFront: 1,
  },
  {
    row: SeatRow.K,
    block: SeatBlock.Left,
    zone: SeatZone.Standard,
    y: 550,
    count: 4,
    firstNumber: 1,
    startX: 125,
    rowFromFront: 2,
  },
  {
    row: SeatRow.K,
    block: SeatBlock.Right,
    zone: SeatZone.Standard,
    y: 550,
    count: 4,
    firstNumber: 5,
    startX: 1547,
    rowFromFront: 2,
  },
  // Centre block, front to back
  {
    row: SeatRow.A,
    block: SeatBlock.Centre,
    zone: SeatZone.Priority,
    y: 550,
    count: 9,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 1,
  },
  {
    row: SeatRow.B,
    block: SeatBlock.Centre,
    zone: SeatZone.Priority,
    y: 637,
    count: 9,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 2,
  },
  {
    row: SeatRow.C,
    block: SeatBlock.Centre,
    zone: SeatZone.Standard,
    y: 724,
    count: 10,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 3,
  },
  {
    row: SeatRow.D,
    block: SeatBlock.Centre,
    zone: SeatZone.Standard,
    y: 811,
    count: 11,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 4,
  },
  {
    row: SeatRow.E,
    block: SeatBlock.Centre,
    zone: SeatZone.General,
    y: 898,
    count: 12,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 5,
  },
  {
    row: SeatRow.F,
    block: SeatBlock.Centre,
    zone: SeatZone.General,
    y: 1043,
    count: 11,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 6,
  },
  {
    row: SeatRow.G,
    block: SeatBlock.Centre,
    zone: SeatZone.General,
    y: 1130,
    count: 10,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 7,
  },
  {
    row: SeatRow.H,
    block: SeatBlock.Centre,
    zone: SeatZone.General,
    y: 1217,
    count: 9,
    firstNumber: 1,
    centreX: PLAN_CENTRE_X,
    rowFromFront: 8,
  },
] as const;

/** Number of centre-block rows — quoted in the walking directions. */
export const CENTRE_ROW_COUNT = SEAT_ROW_SPECS.filter(
  (spec) => spec.block === SeatBlock.Centre,
).length;

/** Non-seat features drawn on the plan so it reads like the printed one. */
export enum FixtureKind {
  Entrance = "entrance",
  Stage = "stage",
  Support = "support",
}

export interface PlanFixture {
  id: string;
  label: string;
  kind: FixtureKind;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PLAN_FIXTURES: readonly PlanFixture[] = [
  {
    id: "entrance",
    label: "Entrance",
    kind: FixtureKind.Entrance,
    x: 90,
    y: 6,
    width: 128,
    height: 64,
  },
  {
    id: "cert-table",
    label: "Cert Table",
    kind: FixtureKind.Support,
    x: 343,
    y: 105,
    width: 154,
    height: 50,
  },
  {
    id: "projector",
    label: "Projector",
    kind: FixtureKind.Stage,
    x: 667,
    y: 57,
    width: 549,
    height: 48,
  },
  {
    id: "av-area",
    label: "AV Area",
    kind: FixtureKind.Support,
    x: 1384,
    y: 107,
    width: 139,
    height: 143,
  },
  {
    id: "emcee",
    label: "Emcee",
    kind: FixtureKind.Support,
    x: 1384,
    y: 280,
    width: 139,
    height: 57,
  },
] as const;

/** Zoom applied when the map focuses on a single seat. */
export const SEAT_FOCUS_SCALE = 2.4;
export const SEAT_FOCUS_TRANSITION_MS = 700;
