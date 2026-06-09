/**
 * hitDetection — decide whether a fired line y = m·x + b destroys asteroids.
 *
 * A shot is a hit when the line passes through an asteroid's weak point (within
 * tolerance), the weak point lies ahead of the cannon in the firing direction,
 * and no wall blocks the path. Linked groups and friendly ships layer additional
 * campaign rules on top of these per-target checks.
 */
import type { Point } from './lineMath';
import { getYAtX, getMissDistance, isPointOnLine } from './lineMath';
import type { AsteroidSpec, Facing, FriendlySpec, WallSpec } from '../levels/types';

/** Per-asteroid evaluation of a single shot. */
export interface ShotResult {
  asteroidId: string;
  hit: boolean;
  /** On the line + in range, but a wall stands between the cannon and the weak point. */
  blocked: boolean;
  /** y of the line at the asteroid's x — shown in feedback. */
  lineYAtX: number;
  /** Vertical distance from the line to the weak point. */
  missDistance: number;
  weakPoint: Point;
}

/** Forgiving by default: within ~⅓ of a grid square counts as a hit. */
export const DEFAULT_HIT_TOLERANCE = 0.35;

/** Evaluate the shot against one asteroid. */
export function evaluateAsteroid(
  m: number,
  b: number,
  asteroid: AsteroidSpec,
  fromX: number,
  tolerance: number = DEFAULT_HIT_TOLERANCE,
  facing: Facing = 'right',
  walls: WallSpec[] = [],
): ShotResult {
  const wp = asteroid.weakPoint;
  // The shot only travels in the facing direction, so only asteroids on that
  // side of the cannon are reachable (the line itself is infinite both ways).
  const inRange = facing === 'right' ? wp.x >= fromX : wp.x <= fromX;
  const onLine = inRange && isPointOnLine(m, b, wp, tolerance);
  // A wall between the cannon and the weak point stops the shot before it lands.
  const from: Point = { x: fromX, y: getYAtX(m, b, fromX) };
  const blocked = onLine && isPathBlocked(from, wp, walls);
  return {
    asteroidId: asteroid.id,
    hit: onLine && !blocked,
    blocked,
    lineYAtX: getYAtX(m, b, wp.x),
    missDistance: getMissDistance(m, b, wp),
    weakPoint: wp,
  };
}

/** Evaluate the shot against every (still-alive) asteroid passed in. */
export function evaluateShot(
  m: number,
  b: number,
  asteroids: AsteroidSpec[],
  fromX: number,
  tolerance: number = DEFAULT_HIT_TOLERANCE,
  facing: Facing = 'right',
  walls: WallSpec[] = [],
): ShotResult[] {
  return asteroids.map((a) => evaluateAsteroid(m, b, a, fromX, tolerance, facing, walls));
}

/**
 * Apply linked-group "all-or-none" (Zone 6) to a shot's per-asteroid results.
 *
 * A solo asteroid (no `linkGroup`) is destroyed independently when hit. A linked
 * group's members are destroyed ONLY when a single shot hits every member; a
 * group that's only partially hit destroys nothing (and is reported in
 * `partialGroups` so the UI can explain "you only clipped one of the chain").
 *
 * Pass the asteroids that were actually targetable this shot (alive, and — in
 * sequential levels — currently active), matching the `results` array.
 */
export function resolveDestroyed(
  results: ShotResult[],
  asteroids: AsteroidSpec[],
): { destroyedIds: Set<string>; partialGroups: string[] } {
  const hit = new Set(results.filter((r) => r.hit).map((r) => r.asteroidId));
  const groups = new Map<string, AsteroidSpec[]>();
  const destroyedIds = new Set<string>();

  for (const a of asteroids) {
    if (!a.linkGroup) {
      if (hit.has(a.id)) destroyedIds.add(a.id); // solo: independent
    } else {
      const members = groups.get(a.linkGroup);
      if (members) members.push(a);
      else groups.set(a.linkGroup, [a]);
    }
  }

  const partialGroups: string[] = [];
  for (const [groupId, members] of groups) {
    if (members.every((a) => hit.has(a.id))) {
      members.forEach((a) => destroyedIds.add(a.id));
    } else if (members.some((a) => hit.has(a.id))) {
      partialGroups.push(groupId);
    }
  }
  return { destroyedIds, partialGroups };
}

/**
 * True when a friendly ship (Zone 7) sits in the line of fire: on the fired line
 * within tolerance, in the firing direction, and not shielded by a wall in front
 * of it. Mirrors {@link evaluateAsteroid} but for a no-go point.
 */
export function hitsFriendly(
  m: number,
  b: number,
  friendly: FriendlySpec,
  fromX: number,
  tolerance: number = DEFAULT_HIT_TOLERANCE,
  facing: Facing = 'right',
  walls: WallSpec[] = [],
): boolean {
  const p = friendly.position;
  const inRange = facing === 'right' ? p.x >= fromX : p.x <= fromX;
  if (!inRange || !isPointOnLine(m, b, p, tolerance)) return false;
  const from: Point = { x: fromX, y: getYAtX(m, b, fromX) };
  return !isPathBlocked(from, p, walls); // a wall in front protects the friendly
}

/**
 * Intersection point of segments p1→p2 and p3→p4, or null if they don't cross
 * (or are parallel/collinear). Standard parametric form.
 */
export function segmentIntersection(p1: Point, p2: Point, p3: Point, p4: Point): Point | null {
  const d1x = p2.x - p1.x;
  const d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x;
  const d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-12) return null; // parallel or collinear
  const t = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const u = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return { x: p1.x + t * d1x, y: p1.y + t * d1y };
}

/** True when point p lies within a wall gap's bounding box (p is already on the wall line). */
function pointInGap(p: Point, gap: { from: Point; to: Point }): boolean {
  const within = (a: number, b: number, v: number) =>
    v >= Math.min(a, b) - 1e-9 && v <= Math.max(a, b) + 1e-9;
  return within(gap.from.x, gap.to.x, p.x) && within(gap.from.y, gap.to.y, p.y);
}

/**
 * The nearest point to `from` where the path `from`→`to` crosses a wall (and not
 * through one of the wall's gaps), or null if the path is clear. Used to stop
 * the beam at the shield it hits.
 */
export function firstWallHit(from: Point, to: Point, walls: WallSpec[]): Point | null {
  let best: Point | null = null;
  let bestDist = Infinity;
  for (const wall of walls) {
    const p = segmentIntersection(from, to, wall.from, wall.to);
    if (!p) continue;
    if (wall.gaps && wall.gaps.some((g) => pointInGap(p, g))) continue; // shot threads the gap
    const dist = (p.x - from.x) ** 2 + (p.y - from.y) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = p;
    }
  }
  return best;
}

/**
 * True if the straight path from `from` to `to` is blocked by a wall (and does
 * not pass through one of the wall's gaps).
 */
export function isPathBlocked(from: Point, to: Point, walls: WallSpec[]): boolean {
  return firstWallHit(from, to, walls) !== null;
}

/**
 * The nearest friendly-ship position to `from` that lies within `tolerance` of
 * the beam segment `from`→`to`, or null if the beam clears every friendly. Used
 * to halt the beam visually at the friendly it would strike (Zone 7).
 */
export function firstFriendlyHit(
  from: Point,
  to: Point,
  friendlies: FriendlySpec[],
  tolerance: number = DEFAULT_HIT_TOLERANCE,
): Point | null {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const lenSq = dx * dx + dy * dy;
  let best: Point | null = null;
  let bestT = Infinity;
  for (const f of friendlies) {
    const p = f.position;
    // Projection parameter of p onto the segment (clamped to [0, 1]).
    const t = lenSq === 0 ? 0 : ((p.x - from.x) * dx + (p.y - from.y) * dy) / lenSq;
    if (t < 0 || t > 1) continue; // behind the cannon or past the beam end
    const proj = { x: from.x + t * dx, y: from.y + t * dy };
    const dist = Math.hypot(p.x - proj.x, p.y - proj.y);
    if (dist <= tolerance && t < bestT) {
      bestT = t;
      best = p;
    }
  }
  return best;
}
