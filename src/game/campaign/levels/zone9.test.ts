import { describe, it, expect } from 'vitest';
import { zoneNine } from './zone9';
import {
  evaluateShot,
  hitsFriendly,
  resolveDestroyed,
  DEFAULT_HIT_TOLERANCE,
} from '../../logic/hitDetection';
import type { CampaignLevel } from '../types';
import type { Facing } from '../../levels/types';

const byId = (id: string) => zoneNine.levels.find((l) => l.id === id)!;

/**
 * Fire a dialed (m, b, xOffset, facing) shot at a Zone 9 level.
 * Replicates the full Game.tsx geometry.
 */
function fire(level: CampaignLevel, m: number, b: number, xOffset: number, facing: Facing) {
  const shipX = level.config.ship.position.x + xOffset;
  const bEff = b - m * xOffset;
  const fireM = facing === 'right' ? m : -m;
  const fireB = bEff + shipX * (m - fireM);
  const asteroids = level.config.asteroids;
  const walls = level.config.walls;
  const friendlies = level.config.friendlies ?? [];
  const results = evaluateShot(fireM, fireB, asteroids, shipX, DEFAULT_HIT_TOLERANCE, facing, walls);
  const scrub = friendlies.some((f) =>
    hitsFriendly(fireM, fireB, f, shipX, DEFAULT_HIT_TOLERANCE, facing, walls),
  );
  const { destroyedIds, partialGroups } = resolveDestroyed(results, asteroids);
  return {
    destroyed: scrub ? [] : [...destroyedIds].sort(),
    scrub,
    partialGroups,
    blocked: results.filter((r) => r.blocked).map((r) => r.asteroidId),
  };
}

describe('zone 9 structure', () => {
  it('is the capstone zone of five levels, using typed equations and locking out previews', () => {
    expect(zoneNine.id).toBe('zone-9');
    expect(zoneNine.status).toBe('available');
    expect(zoneNine.levels.map((l) => l.id)).toEqual(['z9-l1', 'z9-l2', 'z9-l3', 'z9-l4', 'z9-l5']);
    
    for (const level of zoneNine.levels) {
      expect(level.config.allowedControls).toEqual(['direction']);
      expect(level.config.equationEntry).toBe('typed');
      expect(level.config.trajectoryPreview).toBe('off');
      expect(level.config.lockTrajectoryPreview).toBe(true);
    }
  });

  it('z9-l1 is fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z9-l1').adaptive).toBeUndefined();
    for (const id of ['z9-l2', 'z9-l3', 'z9-l4', 'z9-l5']) expect(byId(id).adaptive).toBe(true);
    expect(byId('z9-l1').config.hearts).toBe(5);
    expect(byId('z9-l5').config.hearts).toBe(3);
  });

  it('includes reflections on slope-at-distance, point-slope parameters, and equivalence', () => {
    expect(zoneNine.reflections).toHaveLength(3);
    const q1 = zoneNine.reflections![0];
    expect(q1.prompt).toContain('large distance');
    expect(q1.correctIndex).toBe(0);

    const q2 = zoneNine.reflections![1];
    expect(q2.prompt).toContain('y = m(x − h) + b');
    expect(q2.correctIndex).toBe(0);

    const q3 = zoneNine.reflections![2];
    expect(q3.prompt).toContain('y = mx + c');
    expect(q3.correctIndex).toBe(0);
  });
});

describe('zone 9 solvability — solving typed equations under constraints', () => {
  it('z9-l1: solvable with m = 0.5, b = 2', () => {
    const l = byId('z9-l1');
    expect(fire(l, 0.5, 2, 0, 'right').destroyed).toEqual(['a1', 'a2']);
  });

  it('z9-l2: flat shots (m = 0) are blocked by shield walls, requiring sloped lines', () => {
    const l = byId('z9-l2');
    expect(fire(l, 1, 0, 0, 'right').destroyed).toEqual(['a1']); // y = x hits a1
    expect(fire(l, 0.5, 0, 0, 'right').destroyed).toEqual(['a2']); // y = 0.5x hits a2

    // Flat shot at height 4 is blocked
    expect(fire(l, 0, 4, 0, 'right').blocked).toContain('a1');
    expect(fire(l, 0, 4, 0, 'right').destroyed).toEqual([]);

    // Flat shot at height 3 is blocked
    expect(fire(l, 0, 3, 0, 'right').blocked).toContain('a2');
    expect(fire(l, 0, 3, 0, 'right').destroyed).toEqual([]);
  });

  it('z9-l3: distant target requires precision; alternative integer slopes are blocked', () => {
    const l = byId('z9-l3');
    // Perfect slope hits
    expect(fire(l, -0.75, 0, 0, 'right').destroyed).toEqual(['a1']);

    // Inexact slopes miss due to compounding error at x = 8
    expect(fire(l, -0.7, 0, 0, 'right').destroyed).toEqual([]);
    expect(fire(l, -0.8, 0, 0, 'right').destroyed).toEqual([]);

    // Alternative integer slope y = -1x + 2 is blocked by the wall at x = 4
    expect(fire(l, -1, 2, 0, 'right').blocked).toContain('a1');
    expect(fire(l, -1, 2, 0, 'right').destroyed).toEqual([]);
  });

  it('z9-l4: chain is blocked from the origin, requiring cannon slide and offset computation', () => {
    const l = byId('z9-l4');
    // Sliding cannon to xOffset = 4 is clear
    expect(fire(l, 0.5, 1, 4, 'right').destroyed).toEqual(['a1', 'a2']);

    // Attempting same line y = 0.5x - 1 from the origin is blocked at x = 2
    expect(fire(l, 0.5, -1, 0, 'right').blocked).toContain('a1');
    expect(fire(l, 0.5, -1, 0, 'right').destroyed).toEqual([]);
  });

  it('z9-l5: mastery check requires sliding, avoiding friendlies, and separate target logic', () => {
    const l = byId('z9-l5');
    // Slid shot (xOffset = 2) hits the chain and avoids the friendly at (4,4)
    const chainShot = fire(l, 0.5, 2, 2, 'right');
    expect(chainShot.destroyed).toEqual(['a1', 'a2']);
    expect(chainShot.scrub).toBe(false);

    // Un-slid chain line is blocked
    expect(fire(l, 0.5, 1, 0, 'right').blocked).toContain('a1');

    // Loner is hit separately from the origin
    expect(fire(l, -0.4, 0, 0, 'right').destroyed).toEqual(['a3']);
  });
});
