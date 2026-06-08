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

describe('facing direction (Zone 4)', () => {
  // y = x passes through both (2,2) on the right and (-3,-3) on the left.
  const right: AsteroidSpec = { id: 'r', weakPoint: { x: 2, y: 2 } };
  const left: AsteroidSpec = { id: 'l', weakPoint: { x: -3, y: -3 } };

  it('facing right hits the right-side target and not the left', () => {
    expect(evaluateAsteroid(1, 0, right, 0, undefined, 'right').hit).toBe(true);
    expect(evaluateAsteroid(1, 0, left, 0, undefined, 'right').hit).toBe(false);
  });

  it('facing left hits the left-side target and not the right', () => {
    expect(evaluateAsteroid(1, 0, left, 0, undefined, 'left').hit).toBe(true);
    expect(evaluateAsteroid(1, 0, right, 0, undefined, 'left').hit).toBe(false);
  });

  it('defaults to facing right when omitted', () => {
    expect(evaluateAsteroid(1, 0, right, 0).hit).toBe(true);
    expect(evaluateAsteroid(1, 0, left, 0).hit).toBe(false);
  });
});
