/**
 * scoring — turn destroyed asteroids into points.
 *
 * Kept tiny and pure so scoring rules (bonuses, multipliers) can grow without
 * touching the UI.
 */
import type { AsteroidSpec } from '../levels/types';

export const DEFAULT_ASTEROID_POINTS = 100;
/** Extra points per additional asteroid destroyed in the same shot. */
export const MULTI_HIT_BONUS = 50;

export function pointsForAsteroid(asteroid: AsteroidSpec): number {
  return asteroid.points ?? DEFAULT_ASTEROID_POINTS;
}

/**
 * Score a single shot. Destroying several asteroids at once (e.g. a future
 * linked group) earns a multi-hit bonus.
 */
export function scoreShot(destroyed: AsteroidSpec[]): number {
  const base = destroyed.reduce((sum, a) => sum + pointsForAsteroid(a), 0);
  const bonus = destroyed.length > 1 ? (destroyed.length - 1) * MULTI_HIT_BONUS : 0;
  return base + bonus;
}
