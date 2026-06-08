import { describe, it, expect } from 'vitest';
import { zoneTwo } from './zone2';
import { getYAtX } from '../../logic/lineMath';
import type { AsteroidSpec } from '../../levels/types';

/**
 * Guards against typo'd coordinates: every Zone 2 weak point must lie exactly on
 * the slope/intercept line the level is designed around, with m and b reachable
 * by the controls (slope step 0.5, intercept step 0.5).
 */
function expectOnLine(asteroids: AsteroidSpec[], m: number, b: number, ids: string[]) {
  for (const id of ids) {
    const a = asteroids.find((x) => x.id === id);
    expect(a, `missing asteroid ${id}`).toBeDefined();
    expect(getYAtX(m, b, a!.weakPoint.x)).toBeCloseTo(a!.weakPoint.y, 9);
  }
}

const byId = (id: string) => zoneTwo.levels.find((l) => l.id === id)!;

describe('zone 2 geometry', () => {
  it('is registered as an available zone with five levels', () => {
    expect(zoneTwo.id).toBe('zone-2');
    expect(zoneTwo.status).toBe('available');
    expect(zoneTwo.levels.map((l) => l.id)).toEqual(['z2-l1', 'z2-l2', 'z2-l3', 'z2-l4', 'z2-l5']);
  });

  it('z2-l1 targets lie on y = x + 2', () => {
    expectOnLine(byId('z2-l1').config.asteroids, 1, 2, ['a1', 'a2']);
  });

  it('z2-l2 targets lie on the horizontal line y = 5', () => {
    expectOnLine(byId('z2-l2').config.asteroids, 0, 5, ['a1', 'a2']);
  });

  it('z2-l3 targets need the same slope but different intercepts', () => {
    const { asteroids } = byId('z2-l3').config;
    expectOnLine(asteroids, 1, 2, ['a1']); // (2,4) on y = x + 2
    expectOnLine(asteroids, 1, 1, ['a2']); // (5,6) on y = x + 1
  });

  it('z2-l4 mixed targets each lie on their intended (m, b) line', () => {
    const { asteroids } = byId('z2-l4').config;
    expectOnLine(asteroids, 1, 3, ['a1']);
    expectOnLine(asteroids, 0.5, 2, ['a2']);
    expectOnLine(asteroids, 1.5, 2.5, ['a3']);
    expectOnLine(asteroids, 0.5, 0.5, ['a4']);
  });

  it('z2-l5 pairs each lie on one slanted line and skips the trajectory preview', () => {
    const level = byId('z2-l5');
    expect(level.config.trajectoryPreview).toBe('after-fire');
    expectOnLine(level.config.asteroids, 1, 2, ['a1', 'a2']); // y = x + 2
    expectOnLine(level.config.asteroids, 0.5, 1, ['a3', 'a4']); // y = 0.5x + 1
  });

  it('z2-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z2-l1').adaptive).toBeUndefined();
    for (const id of ['z2-l2', 'z2-l3', 'z2-l4', 'z2-l5']) {
      expect(byId(id).adaptive).toBe(true);
    }
  });
});
