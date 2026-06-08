import { describe, it, expect } from 'vitest';
import { zoneFour } from './zone4';
import { getYAtX } from '../../logic/lineMath';
import type { AsteroidSpec } from '../../levels/types';

/**
 * Verifies a target is reachable under the mirror/cannon model: the player dials
 * a slope and faces a side; facing left mirrors the line across the ship, so the
 * shot follows y = effM·x + b with effM = +m (right) or -m (left). The target
 * must lie on that effective line AND on the facing side of the ship (x = 0).
 */
function expectReachable(
  asteroids: AsteroidSpec[],
  dialedM: number,
  b: number,
  facing: 'left' | 'right',
  ids: string[],
) {
  const effM = facing === 'right' ? dialedM : -dialedM;
  for (const id of ids) {
    const a = asteroids.find((x) => x.id === id);
    expect(a, `missing asteroid ${id}`).toBeDefined();
    expect(getYAtX(effM, b, a!.weakPoint.x)).toBeCloseTo(a!.weakPoint.y, 9);
    if (facing === 'right') expect(a!.weakPoint.x).toBeGreaterThanOrEqual(0);
    else expect(a!.weakPoint.x).toBeLessThanOrEqual(0);
  }
}

const byId = (id: string) => zoneFour.levels.find((l) => l.id === id)!;

/** Quadrant of a point (assumes none sit exactly on an axis). */
function quadrant(p: { x: number; y: number }): 1 | 2 | 3 | 4 {
  if (p.x > 0 && p.y > 0) return 1;
  if (p.x < 0 && p.y > 0) return 2;
  if (p.x < 0 && p.y < 0) return 3;
  return 4;
}

describe('zone 4 geometry', () => {
  it('is registered as an available zone with five levels', () => {
    expect(zoneFour.id).toBe('zone-4');
    expect(zoneFour.status).toBe('available');
    expect(zoneFour.levels.map((l) => l.id)).toEqual(['z4-l1', 'z4-l2', 'z4-l3', 'z4-l4', 'z4-l5']);
  });

  it('uses an all-quadrants, slope+intercept+direction config facing right by default', () => {
    const cfg = byId('z4-l1').config;
    expect(cfg.quadrantMode).toBe('all-quadrants');
    expect(cfg.equationForm).toBe('y=mx+b');
    expect(cfg.allowedControls).toEqual(['slope', 'yIntercept', 'direction']);
    expect(cfg.defaults.facing).toBe('right');
    expect(cfg.bounds).toEqual({ minX: -10, maxX: 10, minY: -10, maxY: 10 });
  });

  it('every level covers all four quadrants with at least four asteroids', () => {
    for (const level of zoneFour.levels) {
      const quads = new Set(level.config.asteroids.map((a) => quadrant(a.weakPoint)));
      expect(quads, `${level.id} should hit all four quadrants`).toEqual(new Set([1, 2, 3, 4]));
      expect(level.config.asteroids.length).toBeGreaterThanOrEqual(4);
    }
  });

  it('z4-l1: slope 1 and -1, fired both ways, reach all four quadrants', () => {
    const { asteroids } = byId('z4-l1').config;
    expectReachable(asteroids, 1, 0, 'right', ['a1']); // (2,2) Q1
    expectReachable(asteroids, 1, 0, 'left', ['a2']); // (-3,3) Q2
    expectReachable(asteroids, -1, 0, 'right', ['a3']); // (2,-2) Q4
    expectReachable(asteroids, -1, 0, 'left', ['a4']); // (-3,-3) Q3
  });

  it('z4-l2: non-zero intercept across quadrants', () => {
    const { asteroids } = byId('z4-l2').config;
    expectReachable(asteroids, 1, 2, 'right', ['a1']); // (1,3) Q1
    expectReachable(asteroids, 1, 2, 'left', ['a2']); // (-1,3) Q2
    expectReachable(asteroids, -1, 1, 'right', ['a3']); // (3,-2) Q4
    expectReachable(asteroids, -1, 1, 'left', ['a4']); // (-3,-2) Q3
  });

  it('z4-l3: each target reachable with its own slope + facing', () => {
    const { asteroids } = byId('z4-l3').config;
    expectReachable(asteroids, 0.5, 0, 'right', ['a1']); // (4,2) Q1
    expectReachable(asteroids, 2, 0, 'left', ['a2']); // (-2,4) Q2
    expectReachable(asteroids, -0.5, 0, 'left', ['a3']); // (-4,-2) Q3
    expectReachable(asteroids, -1, 0, 'right', ['a4']); // (3,-3) Q4
  });

  it('z4-l4 has six sequential targets, some sharing a quadrant', () => {
    const cfg = byId('z4-l4').config;
    expect(cfg.asteroids).toHaveLength(6);
    expect(cfg.sequentialTargets).toBe(true);
    expectReachable(cfg.asteroids, 2, 0, 'right', ['a1']); // (2,4) Q1
    expectReachable(cfg.asteroids, 2, 0, 'left', ['a5']); // (-2,4) Q2
    expectReachable(cfg.asteroids, -2, 0, 'left', ['a6']); // (-2,-4) Q3
  });

  it('z4-l5 reaches all four quadrants with two dial settings and skips the preview', () => {
    const level = byId('z4-l5');
    expect(level.config.trajectoryPreview).toBe('after-fire');
    expectReachable(level.config.asteroids, 2, 0, 'right', ['a1']); // (1,2) Q1
    expectReachable(level.config.asteroids, 2, 0, 'left', ['a2']); // (-2,4) Q2
    expectReachable(level.config.asteroids, -0.5, 1, 'right', ['a3']); // (4,-1) Q4
    expectReachable(level.config.asteroids, -0.5, 1, 'left', ['a4']); // (-4,-1) Q3
  });

  it('z4-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z4-l1').adaptive).toBeUndefined();
    for (const id of ['z4-l2', 'z4-l3', 'z4-l4', 'z4-l5']) {
      expect(byId(id).adaptive).toBe(true);
    }
  });

  it('includes the True/False infinite-line reflection', () => {
    const q = zoneFour.reflections?.[0];
    expect(q?.options).toEqual(['True', 'False']);
    expect(q?.correctIndex).toBe(0);
    expect(q?.prompt.toLowerCase()).toContain('infinite line');
  });
});
