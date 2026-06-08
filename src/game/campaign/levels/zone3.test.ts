import { describe, it, expect } from 'vitest';
import { zoneThree } from './zone3';
import { getYAtX } from '../../logic/lineMath';
import type { AsteroidSpec } from '../../levels/types';

/**
 * Guards against typo'd coordinates: every Zone 3 weak point must lie exactly on
 * the (negative) slope line the level is designed around, with m reachable by
 * the slope control (step 0.5). All targets sit in Quadrant IV (x ≥ 0, y ≤ 0).
 */
function expectOnLine(asteroids: AsteroidSpec[], m: number, ids: string[]) {
  for (const id of ids) {
    const a = asteroids.find((x) => x.id === id);
    expect(a, `missing asteroid ${id}`).toBeDefined();
    expect(getYAtX(m, 0, a!.weakPoint.x)).toBeCloseTo(a!.weakPoint.y, 9);
    expect(a!.weakPoint.x).toBeGreaterThanOrEqual(0);
    expect(a!.weakPoint.y).toBeLessThanOrEqual(0);
  }
}

const byId = (id: string) => zoneThree.levels.find((l) => l.id === id)!;

describe('zone 3 geometry', () => {
  it('is registered as an available zone with five levels', () => {
    expect(zoneThree.id).toBe('zone-3');
    expect(zoneThree.status).toBe('available');
    expect(zoneThree.levels.map((l) => l.id)).toEqual(['z3-l1', 'z3-l2', 'z3-l3', 'z3-l4', 'z3-l5']);
  });

  it('uses a Quadrant IV, slope-only config that starts flat (m = 0)', () => {
    const cfg = byId('z3-l1').config;
    expect(cfg.quadrantMode).toBe('quadrant-four');
    expect(cfg.equationForm).toBe('y=mx');
    expect(cfg.allowedControls).toEqual(['slope']);
    expect(cfg.defaults.m).toBe(0);
    expect(cfg.bounds).toEqual({ minX: 0, maxX: 10, minY: -10, maxY: 0 });
  });

  it('z3-l1 targets lie on y = -2x', () => {
    expectOnLine(byId('z3-l1').config.asteroids, -2, ['a1', 'a2']);
  });

  it('z3-l2 needs two different negative slopes', () => {
    const { asteroids } = byId('z3-l2').config;
    expectOnLine(asteroids, -3, ['a1']); // (1,-3)
    expectOnLine(asteroids, -0.5, ['a2']); // (4,-2)
  });

  it('z3-l3 fractional targets each lie on their intended negative slope', () => {
    const { asteroids } = byId('z3-l3').config;
    expectOnLine(asteroids, -0.5, ['a1']);
    expectOnLine(asteroids, -1.5, ['a2']);
  });

  it('z3-l4 mixed targets each lie on their intended negative slope', () => {
    const { asteroids } = byId('z3-l4').config;
    expectOnLine(asteroids, -2, ['a1']);
    expectOnLine(asteroids, -0.5, ['a2']);
    expectOnLine(asteroids, -1, ['a3']);
    expectOnLine(asteroids, -3, ['a4']);
  });

  it('z3-l5 pairs each lie on one falling line and skips the trajectory preview', () => {
    const level = byId('z3-l5');
    expect(level.config.trajectoryPreview).toBe('after-fire');
    expectOnLine(level.config.asteroids, -3, ['a1', 'a2']); // y = -3x
    expectOnLine(level.config.asteroids, -0.5, ['a3', 'a4']); // y = -0.5x
  });

  it('z3-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z3-l1').adaptive).toBeUndefined();
    for (const id of ['z3-l2', 'z3-l3', 'z3-l4', 'z3-l5']) {
      expect(byId(id).adaptive).toBe(true);
    }
  });
});
