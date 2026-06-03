import type { LucideIcon } from "lucide-react";
import { Circle, Star, Triangle, Square } from "lucide-react";

/** Display names for the Virus Fight game + boss. */
export const GAME_NAME = "Virus Fight";
export const BOSS_NAME = "COVID Boss";

/**
 * Game lifecycle. Host transitions these from the control panel;
 * attendees react to them in the lobby / game screen.
 */
export enum GameStatus {
  /** No game scheduled yet. */
  Idle = "idle",
  /** Lobby open, players joining, waiting for host to start. */
  Lobby = "lobby",
  /** Round running — tap mini-viruses for points. */
  Active = "active",
  /** Boss on screen — draw the required shape to defeat it. */
  BossActive = "boss_active",
  /** Round over, leaderboard locked by host. */
  Locked = "locked",
  /** Game ended, winner announced. */
  Ended = "ended",
}

/** Shapes the attendee can be asked to draw to defeat the boss. */
export enum BossShape {
  Circle = "circle",
  Star = "star",
  Triangle = "triangle",
  Square = "square",
}

export const BOSS_SHAPES: readonly BossShape[] = [
  BossShape.Circle,
  BossShape.Star,
  BossShape.Triangle,
  BossShape.Square,
] as const;

export const SHAPE_META: Record<BossShape, { label: string; icon: LucideIcon }> = {
  [BossShape.Circle]: { label: "Circle", icon: Circle },
  [BossShape.Star]: { label: "Star", icon: Star },
  [BossShape.Triangle]: { label: "Triangle", icon: Triangle },
  [BossShape.Square]: { label: "Square", icon: Square },
};

/** Tunable game numbers — keep all magic numbers here, not inline. */
export const GAME_CONFIG = {
  /** Length of a standard round, in seconds. */
  roundSeconds: 60,
  /** Points awarded per mini-virus tapped. */
  pointsPerVirus: 10,
  /** Bonus for defeating the boss with the correct shape. */
  bossBonusPoints: 250,
  /** How long the attendee has to draw the boss shape, in seconds. */
  bossTimeLimitSeconds: 8,
  /** Mini-viruses spawned per host "wave". */
  miniWaveSize: 12,
  /** Number of entries shown on the leaderboard. */
  leaderboardSize: 10,
  /**
   * Confidence (0–1) at which a drawn shape counts as a match.
   * Detection is intentionally forgiving for the demo — convincing, not perfect.
   */
  shapeMatchThreshold: 0.7,
} as const;
