import { describe, it, expect } from 'vitest';
import { zoneEight } from './zone8';
import {
  evaluateShot,
  hitsFriendly,
  resolveDestroyed,
  DEFAULT_HIT_TOLERANCE,
} from '../../logic/hitDetection';
import type { CampaignLevel } from '../types';
import type { Facing } from '../../levels/types';

const byId = (id: string) => zoneEight.levels.find((l) => l.id === id)!;

/**
 * Fire a dialed (m, b, xOffset, facing) shot at a Zone 8 level. Replicates the
 * full Game.tsx geometry: the cannon rides the line at shipX = x-offset, so the
 * effective intercept is bEff = b − m·xOffset; facing mirrors the slope. Walls,
 * friendlies, and link all-or-none are all honored.
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

describe('zone 8 structure', () => {
  it('is the final available zone of five levels, with the x-offset control unlocked', () => {
    expect(zoneEight.id).toBe('zone-8');
    expect(zoneEight.status).toBe('available');
    expect(zoneEight.levels.map((l) => l.id)).toEqual(['z8-l1', 'z8-l2', 'z8-l3', 'z8-l4', 'z8-l5']);
    expect(byId('z8-l1').config.allowedControls).toEqual(['slope', 'yIntercept', 'xOffset', 'direction']);
    expect(byId('z8-l1').config.defaults.xOffset).toBe(0);
  });

  it('z8-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z8-l1').adaptive).toBeUndefined();
    for (const id of ['z8-l2', 'z8-l3', 'z8-l4', 'z8-l5']) expect(byId(id).adaptive).toBe(true);
    expect(byId('z8-l5').config.trajectoryPreview).toBe('after-fire');
  });

  it('includes the True/False point-slope reflection', () => {
    const q = zoneEight.reflections?.find((r) => /same straight line/i.test(r.prompt));
    expect(q?.options).toEqual(['True', 'False']);
    expect(q?.correctIndex).toBe(0); // "True"
  });
});

describe('zone 8 solvability — sliding the cannon opens shots the origin can’t make', () => {
  it('z8-l1: sliding past the shield lets a flat shot clear both; the un-slid shot is blocked', () => {
    const l = byId('z8-l1');
    expect(fire(l, 0, 2, 3, 'right').destroyed).toEqual(['a1', 'a2']); // Δx = 3, y = 2
    expect(fire(l, 0, 2, 0, 'right').blocked).toContain('a1'); // un-slid flat shot blocked by the wall
    expect(fire(l, 0, 2, 0, 'right').destroyed).toEqual([]);
  });

  it('z8-l2: sliding left brings the targets into the forward range', () => {
    const l = byId('z8-l2');
    expect(fire(l, 2, 0, -4, 'right').destroyed).toEqual(['a1', 'a2']); // Δx = -4, y = 2(x + 4)
    expect(fire(l, 2, 0, 0, 'right').destroyed).toEqual([]); // can't reach left targets without sliding
  });

  it('z8-l3: a chain’s fixed line is blocked from the origin — only sliding clears it', () => {
    const l = byId('z8-l3');
    expect(fire(l, 0.5, 1, 2, 'right').destroyed).toEqual(['a1', 'a2']); // Δx = 2, fires y = 0.5x from (2,1)
    expect(fire(l, 0.5, 0, 0, 'right').blocked).toContain('a1'); // same line y = 0.5x blocked from the origin
    expect(fire(l, 0.5, 0, 0, 'right').destroyed).toEqual([]);
  });

  it('z8-l4: slide for the chain, dodge the ally for the loner', () => {
    const l = byId('z8-l4');
    const chain = fire(l, 0.5, 1, 2, 'right'); // Δx = 2 → y = 0.5x
    expect(chain.destroyed).toEqual(['a1', 'a2']);
    expect(chain.scrub).toBe(false);
    expect(fire(l, 2, -5, 0, 'right').destroyed).toEqual(['a3']); // loner via y = 2x - 5
    expect(fire(l, 1, 0, 0, 'right').scrub).toBe(true); // loner's y = x is scrubbed by the ally
  });

  it('z8-l5: final mix — slid chain, left rock, ally untouched', () => {
    const l = byId('z8-l5');
    expect(fire(l, 0.5, 2, 2, 'right').destroyed).toEqual(['a1', 'a2']); // Δx = 2 → y = 0.5x + 1
    expect(fire(l, 0.5, 2, 2, 'right').scrub).toBe(false);
    expect(fire(l, 1, 0, 0, 'left').destroyed).toEqual(['a3']); // left rock, effective y = -x
    expect(fire(l, 0.5, 1, 0, 'right').blocked).toContain('a1'); // un-slid chain line blocked
  });
});
