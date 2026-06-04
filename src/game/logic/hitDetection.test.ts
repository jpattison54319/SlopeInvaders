import { describe, it, expect } from 'vitest';
import { evaluateAsteroid, evaluateShot } from './hitDetection';
import type { AsteroidSpec } from '../levels/types';

const asteroids: AsteroidSpec[] = [
  { id: 'a1', weakPoint: { x: 2, y: 2 } },
  { id: 'a2', weakPoint: { x: 6, y: 3 } },
  { id: 'a3', weakPoint: { x: 3, y: 7 } },
];

describe('evaluateAsteroid', () => {
  it('hits an asteroid the line passes through', () => {
    const r = evaluateAsteroid(1, 0, asteroids[0], 0); // y = x through (2,2)
    expect(r.hit).toBe(true);
    expect(r.missDistance).toBe(0);
    expect(r.lineYAtX).toBe(2);
  });

  it('misses an asteroid off the line and reports the gap', () => {
    const r = evaluateAsteroid(1, 0, asteroids[2], 0); // y = x at x=3 -> 3, target y=7
    expect(r.hit).toBe(false);
    expect(r.lineYAtX).toBe(3);
    expect(r.missDistance).toBe(4);
  });

  it('does not hit asteroids behind the cannon', () => {
    const r = evaluateAsteroid(1, 0, asteroids[0], 5); // fromX=5 excludes x=2
    expect(r.hit).toBe(false);
  });
});

describe('evaluateShot', () => {
  it('hits exactly the targeted asteroid with y = 2x + 1', () => {
    const results = evaluateShot(2, 1, asteroids, 0); // passes through (3,7) only
    const hits = results.filter((r) => r.hit).map((r) => r.asteroidId);
    expect(hits).toEqual(['a3']);
  });

  it('the default line y = x hits only (2,2)', () => {
    const results = evaluateShot(1, 0, asteroids, 0);
    const hits = results.filter((r) => r.hit).map((r) => r.asteroidId);
    expect(hits).toEqual(['a1']);
  });
});
