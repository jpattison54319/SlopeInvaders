import { describe, it, expect } from 'vitest';
import { buildFeedback } from './hints';
import { evaluateShot } from './hitDetection';
import type { AsteroidSpec } from '../levels/types';

const asteroids: AsteroidSpec[] = [
  { id: 'a1', weakPoint: { x: 4, y: 6 } },
  { id: 'a2', weakPoint: { x: 5, y: 7 } },
];

describe('buildFeedback', () => {
  it('explains a hit with the matching coordinates', () => {
    // y = x + 2 passes through (4, 6)
    const results = evaluateShot(1, 2, [asteroids[0]], 0);
    const fb = buildFeedback(1, 2, results);
    expect(fb.hit).toBe(true);
    expect(fb.detail).toContain('At x = 4');
    expect(fb.detail).toContain('y = 6');
  });

  it('explains a miss and suggests increasing slope/intercept when below', () => {
    // y = x at x=5 -> 5, target (5,7): line is below the asteroid
    const results = evaluateShot(1, 0, [{ id: 'a', weakPoint: { x: 5, y: 7 } }], 0);
    const fb = buildFeedback(1, 0, results);
    expect(fb.hit).toBe(false);
    expect(fb.detail).toContain('y = 5');
    expect(fb.detail).toContain('y = 7');
    expect(fb.detail.toLowerCase()).toContain('increasing');
  });
});
