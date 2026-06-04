import { describe, it, expect } from 'vitest';
import { scoreShot, pointsForAsteroid, DEFAULT_ASTEROID_POINTS } from './scoring';
import type { AsteroidSpec } from '../levels/types';

describe('scoring', () => {
  it('uses the default point value when none is specified', () => {
    const a: AsteroidSpec = { id: 'a', weakPoint: { x: 1, y: 1 } };
    expect(pointsForAsteroid(a)).toBe(DEFAULT_ASTEROID_POINTS);
  });

  it('sums points for a single-asteroid shot', () => {
    const destroyed: AsteroidSpec[] = [{ id: 'a', weakPoint: { x: 1, y: 1 }, points: 100 }];
    expect(scoreShot(destroyed)).toBe(100);
  });

  it('awards a multi-hit bonus for several asteroids in one shot', () => {
    const destroyed: AsteroidSpec[] = [
      { id: 'a', weakPoint: { x: 1, y: 1 }, points: 100 },
      { id: 'b', weakPoint: { x: 2, y: 2 }, points: 100 },
    ];
    // 200 base + 50 bonus
    expect(scoreShot(destroyed)).toBe(250);
  });
});
