"use client";

import { useMemo } from "react";
import {
  FixtureKind,
  MapView,
  PLAN_FIXTURES,
  PLAN_HEIGHT,
  PLAN_WIDTH,
  SEAT_FOCUS_SCALE,
  SEAT_FOCUS_TRANSITION_MS,
  SEAT_SIZE,
  SeatCellStatus,
  SeatZone,
} from "@/constants/seating";
import { SEATS, getSeat, type Seat } from "@/utils/seats";
import { cn } from "@/lib/utils";

/**
 * The Gleneagles Hospital Lecture Theatre floor plan, drawn from the geometry in
 * `@/constants/seating` — fixtures, every seat with its label, the attendee's
 * seat highlighted, and (in focus view) a zoom onto it.
 *
 * Used by the attendee "find my seat" screen and by the host roster, where
 * clicking a seat tags it to the selected attendee.
 */
interface LectureTheatreMapProps {
  /** Seat to highlight and (in focus view) zoom to. */
  highlightSeatId?: string | null;
  /** Seats already tagged to an attendee — drawn with a ring. */
  assignedSeatIds?: ReadonlySet<string>;
  view?: MapView;
  onSelectSeat?: (seatId: string) => void;
  /** Text in the pin above the highlighted seat. */
  calloutLabel?: string;
  className?: string;
}

const ZONE_FILL: Record<SeatZone, string> = {
  [SeatZone.Priority]: "var(--seat-priority)",
  [SeatZone.Standard]: "var(--seat-standard)",
  [SeatZone.General]: "var(--seat-general)",
};

function statusOf(
  seat: Seat,
  highlightSeatId: string | null | undefined,
  assigned: ReadonlySet<string> | undefined,
): SeatCellStatus {
  if (seat.isBlocked) return SeatCellStatus.Blocked;
  if (highlightSeatId && seat.id === highlightSeatId) return SeatCellStatus.Mine;
  if (assigned?.has(seat.id)) return SeatCellStatus.Assigned;
  return SeatCellStatus.Available;
}

export function LectureTheatreMap({
  highlightSeatId,
  assignedSeatIds,
  view = MapView.Full,
  onSelectSeat,
  calloutLabel = "Your seat",
  className,
}: LectureTheatreMapProps) {
  const target = getSeat(highlightSeatId);
  const focused = view === MapView.Focus && target !== undefined;

  const transform = useMemo(() => {
    if (!focused || !target) return "none";
    const k = SEAT_FOCUS_SCALE;
    // Centre the seat, then clamp so the zoom never exposes empty canvas.
    const tx = clamp(PLAN_WIDTH / 2 - k * target.centreX, PLAN_WIDTH * (1 - k), 0);
    const ty = clamp(PLAN_HEIGHT / 2 - k * target.centreY, PLAN_HEIGHT * (1 - k), 0);
    return `translate(${tx}px, ${ty}px) scale(${k})`;
  }, [focused, target]);

  return (
    <svg
      viewBox={`0 0 ${PLAN_WIDTH} ${PLAN_HEIGHT}`}
      className={cn("h-auto w-full select-none", className)}
      role="img"
      aria-label={
        target
          ? `Lecture Theatre seating plan, seat ${target.id} highlighted`
          : "Lecture Theatre seating plan"
      }
    >
      <rect
        x={0}
        y={0}
        width={PLAN_WIDTH}
        height={PLAN_HEIGHT}
        rx={24}
        fill="var(--map-surface)"
      />

      <g
        style={{
          transform,
          transformOrigin: "0 0",
          transition: `transform ${SEAT_FOCUS_TRANSITION_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
        }}
      >
        {PLAN_FIXTURES.map((fixture) => {
          const isEntrance = fixture.kind === FixtureKind.Entrance;
          const isStage = fixture.kind === FixtureKind.Stage;
          return (
            <g key={fixture.id}>
              <rect
                x={fixture.x}
                y={fixture.y}
                width={fixture.width}
                height={fixture.height}
                rx={10}
                fill={
                  isStage
                    ? "var(--map-stage)"
                    : isEntrance
                      ? "var(--map-entrance)"
                      : "var(--map-fixture)"
                }
                stroke={isEntrance ? "var(--brand-blue)" : "var(--map-fixture-line)"}
                strokeWidth={2}
                strokeDasharray={isEntrance ? "8 6" : undefined}
              />
              <text
                x={fixture.x + fixture.width / 2}
                y={fixture.y + fixture.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={24}
                fill={isEntrance ? "var(--brand-blue)" : "var(--map-fixture-text)"}
                letterSpacing={1}
              >
                {fixture.label}
              </text>
            </g>
          );
        })}

        {SEATS.map((seat) => {
          const status = statusOf(seat, highlightSeatId, assignedSeatIds);
          const isMine = status === SeatCellStatus.Mine;
          const isBlocked = status === SeatCellStatus.Blocked;
          const isAssigned = status === SeatCellStatus.Assigned;
          const interactive = onSelectSeat !== undefined && !isBlocked;

          return (
            <g
              key={seat.id}
              onClick={interactive ? () => onSelectSeat(seat.id) : undefined}
              className={cn(interactive && "cursor-pointer")}
            >
              <rect
                x={seat.x}
                y={seat.y}
                width={SEAT_SIZE}
                height={SEAT_SIZE}
                rx={8}
                fill={
                  isMine
                    ? "var(--brand-blue)"
                    : isBlocked
                      ? "var(--seat-blocked)"
                      : ZONE_FILL[seat.zone]
                }
                stroke={
                  isMine
                    ? "var(--brand-blue)"
                    : isAssigned
                      ? "var(--seat-assigned-line)"
                      : "transparent"
                }
                strokeWidth={isAssigned ? 4 : 2}
                className={cn(isMine && "animate-seat-pulse")}
              />

              {isBlocked ? (
                <g stroke="var(--map-fixture-text)" strokeWidth={5} strokeLinecap="round">
                  <line
                    x1={seat.x + 12}
                    y1={seat.y + 12}
                    x2={seat.x + SEAT_SIZE - 12}
                    y2={seat.y + SEAT_SIZE - 12}
                  />
                  <line
                    x1={seat.x + SEAT_SIZE - 12}
                    y1={seat.y + 12}
                    x2={seat.x + 12}
                    y2={seat.y + SEAT_SIZE - 12}
                  />
                </g>
              ) : (
                <text
                  x={seat.centreX}
                  y={seat.centreY}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={seat.id.length > 2 ? 18 : 20}
                  fontWeight={isMine ? 700 : 500}
                  fill={isMine ? "var(--primary-foreground)" : "var(--seat-text)"}
                  pointerEvents="none"
                >
                  {seat.id}
                </text>
              )}
            </g>
          );
        })}

        {target && !target.isBlocked ? (
          <g pointerEvents="none">
            <circle
              cx={target.centreX}
              cy={target.centreY}
              r={SEAT_SIZE * 0.9}
              fill="none"
              stroke="var(--brand-blue)"
              strokeWidth={6}
              className="animate-seat-ping"
            />
            {/* Outer g owns the position; the inner one animates, so the CSS
                transform never clobbers the translate. */}
            <g
              transform={`translate(${calloutX(target.centreX)}, ${target.centreY - SEAT_SIZE * 0.85})`}
            >
              <g className="animate-seat-callout-in">
              <rect
                x={-CALLOUT_HALF_WIDTH}
                y={-66}
                width={CALLOUT_HALF_WIDTH * 2}
                height={56}
                rx={18}
                fill="var(--brand-blue)"
              />
              <polygon
                points={`${calloutTailX(target.centreX) - 12},-11 ${calloutTailX(target.centreX) + 12},-11 ${calloutTailX(target.centreX)},4`}
                fill="var(--brand-blue)"
              />
              <text
                x={0}
                y={-38}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={30}
                fontWeight={700}
                fill="var(--primary-foreground)"
              >
                {calloutLabel}
              </text>
              </g>
            </g>
          </g>
        ) : null}
      </g>
    </svg>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Keeps the callout inside the plan when the seat sits near an edge. */
const CALLOUT_HALF_WIDTH = 95;

function calloutX(seatCentreX: number): number {
  return clamp(seatCentreX, CALLOUT_HALF_WIDTH + 8, PLAN_WIDTH - CALLOUT_HALF_WIDTH - 8);
}

/** Tail position relative to the (possibly shifted) callout body. */
function calloutTailX(seatCentreX: number): number {
  return seatCentreX - calloutX(seatCentreX);
}

/** Colour key for the map — pair it with the plan wherever the map is shown. */
export function MapLegend({
  className,
  mineLabel = "Your seat",
}: {
  className?: string;
  mineLabel?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground",
        className,
      )}
    >
      <LegendSwatch color="var(--brand-blue)" label={mineLabel} />
      <LegendSwatch
        color="var(--seat-standard)"
        borderColor="var(--seat-assigned-line)"
        label="Assigned"
      />
      <LegendSwatch color="var(--seat-general)" label="Free" />
      <LegendSwatch color="var(--seat-blocked)" label="Unavailable" />
    </div>
  );
}

function LegendSwatch({
  color,
  borderColor,
  label,
}: {
  color: string;
  borderColor?: string;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="size-3 rounded-[4px]"
        style={{
          background: color,
          border: borderColor ? `1.5px solid ${borderColor}` : undefined,
        }}
      />
      {label}
    </span>
  );
}
