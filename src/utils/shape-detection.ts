/**
 * Boss-shape detection for the Virus Fight game (Screen 4).
 *
 * The attendee draws a shape to defeat the COVID Boss; this turns a raw pointer
 * stroke into a confidence score per {@link BossShape}. It is intentionally
 * **simple/convincing for the demo, not perfect** — a cooperative attempt at the
 * requested shape passes, while a dot, a line, or an obviously different shape
 * fails.
 *
 * Approach: resample the stroke to a fixed point count, then read four robust
 * features — closedness, radius coefficient-of-variation (cvR), sharp-corner
 * count, and outer-radius peaks — and blend them per target shape. The cvR
 * bands (circle ≈ 0, square ≈ 0.11, triangle ≈ 0.23, star ≈ 0.25) do most of the
 * separation; corner counts disambiguate the star. Thresholds were tuned against
 * synthetic clean + hand-jittered strokes. See GAME_CONFIG.shapeMatchThreshold.
 */
import { BossShape, BOSS_SHAPES, GAME_CONFIG } from "@/constants/game";

export interface StrokePoint {
  x: number;
  y: number;
}

export interface ShapeMatch {
  /** The target shape this result is about (or the best guess, for classify). */
  shape: BossShape;
  /** Confidence in [0, 1] that the stroke is this shape. */
  confidence: number;
  /** Whether confidence clears GAME_CONFIG.shapeMatchThreshold. */
  matched: boolean;
}

/** Detector structural parameters (named — no inline magic numbers). */
const DETECTION = {
  /** Points the stroke is resampled to before analysis. */
  resampleCount: 64,
  /** Neighbourhood (points each side) used to measure turning angle. */
  cornerWindow: 4,
  /** Turning angle (degrees) at which a point counts as a sharp corner. */
  cornerMinDeg: 50,
  /** Below this many raw points, the stroke is too short to judge. */
  minPoints: 10,
  /** Below this bounding-box size (px), the stroke is a tap/scribble, not a shape. */
  minBoundingBox: 36,
} as const;

interface StrokeMetrics {
  valid: boolean;
  /** Largest bounding-box dimension (px). */
  size: number;
  /** Short side / long side of the bounding box (1 = square-ish). */
  aspect: number;
  /** 0–1: how closed the loop is (end returns to start). */
  closedness: number;
  /** Coefficient of variation of the radius from the centroid. */
  cvR: number;
  /** Count of sharp corners around the loop. */
  corners: number;
  /** Count of outer-radius peaks (≈ 5 for a 5-pointed star). */
  peaks: number;
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const distance = (a: StrokePoint, b: StrokePoint) => Math.hypot(a.x - b.x, a.y - b.y);

function pathLength(points: StrokePoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

/** Resample a stroke to `n` points spaced evenly along its arc length. */
function resample(points: StrokePoint[], n: number): StrokePoint[] {
  const pts = points.map((p) => ({ ...p }));
  const interval = pathLength(pts) / (n - 1);
  if (!(interval > 0)) return pts.slice(0, 1);

  let accumulated = 0;
  const out: StrokePoint[] = [{ ...pts[0] }];
  for (let i = 1; i < pts.length; i++) {
    const d = distance(pts[i - 1], pts[i]);
    if (accumulated + d >= interval) {
      const t = (interval - accumulated) / d;
      const q = {
        x: pts[i - 1].x + t * (pts[i].x - pts[i - 1].x),
        y: pts[i - 1].y + t * (pts[i].y - pts[i - 1].y),
      };
      out.push(q);
      pts.splice(i, 0, q);
      accumulated = 0;
    } else {
      accumulated += d;
    }
  }
  while (out.length < n) out.push({ ...pts[pts.length - 1] });
  return out.slice(0, n);
}

function centroidOf(points: StrokePoint[]): StrokePoint {
  let x = 0;
  let y = 0;
  for (const p of points) {
    x += p.x;
    y += p.y;
  }
  return { x: x / points.length, y: y / points.length };
}

/** Unsigned turning angle (degrees) at b, going a → b → c. */
function turnDegrees(a: StrokePoint, b: StrokePoint, c: StrokePoint): number {
  const v1x = b.x - a.x;
  const v1y = b.y - a.y;
  const v2x = c.x - b.x;
  const v2y = c.y - b.y;
  const dot = v1x * v2x + v1y * v2y;
  const cross = v1x * v2y - v1y * v2x;
  return Math.atan2(Math.abs(cross), dot) * (180 / Math.PI);
}

function analyzeStroke(raw: StrokePoint[]): StrokeMetrics {
  const xs = raw.map((p) => p.x);
  const ys = raw.map((p) => p.y);
  const width = Math.max(...xs) - Math.min(...xs);
  const height = Math.max(...ys) - Math.min(...ys);
  const size = Math.max(width, height);
  const aspect = size > 0 ? Math.min(width, height) / size : 0;

  if (raw.length < DETECTION.minPoints || size < DETECTION.minBoundingBox) {
    return { valid: false, size, aspect, closedness: 0, cvR: 0, corners: 0, peaks: 0 };
  }

  const rs = resample(raw, DETECTION.resampleCount);
  const n = rs.length;
  const center = centroidOf(rs);

  const radii = rs.map((p) => distance(p, center));
  const meanR = radii.reduce((s, r) => s + r, 0) / n;
  const variance = radii.reduce((s, r) => s + (r - meanR) ** 2, 0) / n;
  const cvR = meanR > 0 ? Math.sqrt(variance) / meanR : 0;

  const gap = distance(rs[0], rs[n - 1]);
  const closedness = clamp01(1 - gap / (size * 0.6));

  // Turning angle at each point (wrap-around — the start/end join is arbitrary
  // on a closed loop). A wide window makes this robust to finger jitter.
  const W = DETECTION.cornerWindow;
  const turn = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const a = rs[(i - W + n) % n];
    const b = rs[i];
    const c = rs[(i + W) % n];
    turn[i] = turnDegrees(a, b, c);
  }
  // Corners = local maxima of turning above threshold (non-max suppressed).
  let corners = 0;
  for (let i = 0; i < n; i++) {
    if (turn[i] < DETECTION.cornerMinDeg) continue;
    let isMax = true;
    for (let k = -W; k <= W; k++) {
      if (k === 0) continue;
      if (turn[(i + k + n) % n] > turn[i]) {
        isMax = false;
        break;
      }
    }
    if (isMax) corners++;
  }

  // Outer-radius peaks (a 5-pointed star has ~5).
  const smoothed = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let k = -2; k <= 2; k++) s += radii[(i + k + n) % n];
    smoothed[i] = s / 5;
  }
  let peaks = 0;
  for (let i = 0; i < n; i++) {
    if (smoothed[i] <= meanR * 1.04) continue;
    let isMax = true;
    for (let k = -3; k <= 3; k++) {
      if (k === 0) continue;
      if (smoothed[(i + k + n) % n] > smoothed[i]) {
        isMax = false;
        break;
      }
    }
    if (isMax) peaks++;
  }

  return { valid: true, size, aspect, closedness, cvR, corners, peaks };
}

const cornerScore = (corners: number, target: number, spread: number) =>
  clamp01(1 - Math.abs(corners - target) / spread);

/** 1 inside [lo, hi], ramping linearly to 0 over `soft` units outside. */
function band(v: number, lo: number, hi: number, soft: number): number {
  if (v < lo) return clamp01(1 - (lo - v) / soft);
  if (v > hi) return clamp01(1 - (v - hi) / soft);
  return 1;
}

/** Confidence in [0, 1] that the metrics describe `target`. */
function confidenceFor(target: BossShape, m: StrokeMetrics): number {
  if (!m.valid) return 0;
  const base = m.closedness; // all four targets are drawn as closed loops
  switch (target) {
    case BossShape.Circle: {
      const roundness = clamp01(1 - m.cvR / 0.1); // radius near-constant
      const fewCorners = clamp01(1 - m.corners / 3);
      return base * (0.65 * roundness + 0.35 * fewCorners);
    }
    case BossShape.Square: {
      const cvBand = band(m.cvR, 0.06, 0.17, 0.08);
      const corner = cornerScore(m.corners, 4, 2.2);
      const aspectScore = clamp01(1 - (1 - m.aspect) / 0.5);
      return base * (0.4 * cvBand + 0.35 * corner + 0.25 * aspectScore);
    }
    case BossShape.Triangle: {
      const cvBand = band(m.cvR, 0.16, 0.32, 0.09);
      const corner = cornerScore(m.corners, 3, 2.2);
      const notStar = clamp01(1 - (m.corners - 4) / 4);
      return base * (0.45 * cvBand + 0.4 * corner + 0.15 * notStar);
    }
    case BossShape.Star: {
      const spiky = clamp01((m.corners - 4) / 3);
      const cvHigh = clamp01((m.cvR - 0.18) / 0.1);
      const peaky = clamp01(1 - Math.abs(m.peaks - 5) / 3);
      return base * (0.5 * spiky + 0.3 * cvHigh + 0.2 * peaky);
    }
    default:
      return 0;
  }
}

/** Score a drawn stroke against the shape the boss is asking for. */
export function matchShape(points: StrokePoint[], target: BossShape): ShapeMatch {
  const confidence = confidenceFor(target, analyzeStroke(points));
  return {
    shape: target,
    confidence,
    matched: confidence >= GAME_CONFIG.shapeMatchThreshold,
  };
}

/** Best-guess classification of a stroke across all boss shapes (debug/host use). */
export function classifyStroke(points: StrokePoint[]): ShapeMatch {
  const metrics = analyzeStroke(points);
  let best: ShapeMatch = { shape: BOSS_SHAPES[0], confidence: 0, matched: false };
  for (const shape of BOSS_SHAPES) {
    const confidence = confidenceFor(shape, metrics);
    if (confidence > best.confidence) {
      best = { shape, confidence, matched: confidence >= GAME_CONFIG.shapeMatchThreshold };
    }
  }
  return best;
}
