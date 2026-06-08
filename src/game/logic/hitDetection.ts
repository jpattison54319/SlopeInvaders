/**
 * hitDetection — decide whether a fired line y = m·x + b destroys asteroids.
 *
 * A shot is a hit when the line passes through an asteroid's weak point (within
 * tolerance) and the weak point lies ahead of the cannon in the firing
 * direction. Wall blocking is stubbed for a future milestone.
 */
import type { Point } from './lineMath';
import { getYAtX, getMissDistance, isPointOnLine } from './lineMath';
import type { AsteroidSpec, Facing, WallSpec } from '../levels/types';

/** Per-asteroid evaluation of a single shot. */
export interface ShotResult {
  asteroidId: string;
  hit: boolean;
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
): ShotResult {
  const wp = asteroid.weakPoint;
  // The shot only travels in the facing direction, so only asteroids on that
  // side of the cannon are reachable (the line itself is infinite both ways).
  const inRange = facing === 'right' ? wp.x >= fromX : wp.x <= fromX;
  const hit = inRange && isPointOnLine(m, b, wp, tolerance);
  // TODO: when walls exist, also require !isPathBlocked(cannon, wp, walls).
  return {
    asteroidId: asteroid.id,
    hit,
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
): ShotResult[] {
  return asteroids.map((a) => evaluateAsteroid(m, b, a, fromX, tolerance, facing));
}

/**
 * Future: returns true if the straight path from `from` to `to` is blocked by a
 * wall (and does not pass through one of the wall's gaps).
 */
export function isPathBlocked(
  _from: Point,
  _to: Point,
  _walls: WallSpec[],
): boolean {
  void _from;
  void _to;
  void _walls;

  // TODO: segment/segment intersection against each wall, honoring shield gaps.
  return false;
}
