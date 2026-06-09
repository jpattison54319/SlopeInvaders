import { describe, it, expect } from 'vitest';
import { zoneSeven } from './zone7';
import {
  evaluateShot,
  hitsFriendly,
  resolveDestroyed,
  DEFAULT_HIT_TOLERANCE,
} from '../../logic/hitDetection';
import type { CampaignLevel } from '../types';
import type { Facing } from '../../levels/types';

const byId = (id: string) => zoneSeven.levels.find((l) => l.id === id)!;

/**
 * Fire a dialed (m, b, facing) shot at a Zone 7 level and report what is
 * destroyed plus whether the shot was scrubbed by a friendly. Mirrors Game.tsx:
 * a friendly anywhere in the line of fire voids every hit; links are all-or-none.
 */
function fire(level: CampaignLevel, m: number, b: number, facing: Facing) {
  const effM = facing === 'right' ? m : -m;
  const asteroids = level.config.asteroids;
  const walls = level.config.walls;
  const friendlies = level.config.friendlies ?? [];
  const results = evaluateShot(effM, b, asteroids, 0, DEFAULT_HIT_TOLERANCE, facing, walls);
  const scrub = friendlies.some((f) =>
    hitsFriendly(effM, b, f, 0, DEFAULT_HIT_TOLERANCE, facing, walls),
  );
  const { destroyedIds, partialGroups } = resolveDestroyed(results, asteroids);
  return {
    destroyed: scrub ? [] : [...destroyedIds].sort(),
    scrub,
    partialGroups,
    blocked: results.filter((r) => r.blocked).map((r) => r.asteroidId),
  };
}

describe('zone 7 structure', () => {
  it('is an available zone of five levels and every level has friendlies', () => {
    expect(zoneSeven.id).toBe('zone-7');
    expect(zoneSeven.status).toBe('available');
    expect(zoneSeven.levels.map((l) => l.id)).toEqual(['z7-l1', 'z7-l2', 'z7-l3', 'z7-l4', 'z7-l5']);
    for (const level of zoneSeven.levels) {
      expect((level.config.friendlies ?? []).length, `${level.id} should have friendlies`).toBeGreaterThan(0);
    }
  });

  it('z7-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z7-l1').adaptive).toBeUndefined();
    for (const id of ['z7-l2', 'z7-l3', 'z7-l4', 'z7-l5']) expect(byId(id).adaptive).toBe(true);
    expect(byId('z7-l5').config.trajectoryPreview).toBe('after-fire');
  });

  it('includes the True/False "a friendly never blocks a target forever" reflection', () => {
    const q = zoneSeven.reflections?.find((r) => /cannot be hit/i.test(r.prompt));
    expect(q?.options).toEqual(['True', 'False']);
    expect(q?.correctIndex).toBe(1); // "False"
  });
});

describe('zone 7 solvability — a clean line exists; the lazy line is scrubbed by an ally', () => {
  it('z7-l1: y = 2x - 2 clears the target; y = x is scrubbed by the ally', () => {
    const l = byId('z7-l1');
    expect(fire(l, 2, -2, 'right').destroyed).toEqual(['a1']);
    expect(fire(l, 2, -2, 'right').scrub).toBe(false);
    expect(fire(l, 1, 0, 'right').scrub).toBe(true); // ally at (4,4) sits on y = x
    expect(fire(l, 1, 0, 'right').destroyed).toEqual([]);
  });

  it('z7-l2: each rock has a friendly-free line; each easy line is scrubbed', () => {
    const l = byId('z7-l2');
    expect(fire(l, 2, -4, 'right').destroyed).toEqual(['a1']); // y = 2x - 4 misses both allies
    expect(fire(l, 1, -3, 'right').destroyed).toEqual(['a2']); // y = x - 3 misses both allies
    expect(fire(l, 1, 0, 'right').scrub).toBe(true); // y = x hits ally (2,2)
    expect(fire(l, 0.5, 0, 'right').scrub).toBe(true); // y = 0.5x hits ally (4,2)
  });

  it('z7-l3: the chain line is ally-free; the loner must dodge the ally', () => {
    const l = byId('z7-l3');
    const chain = fire(l, 0.5, 0, 'right'); // y = 0.5x
    expect(chain.destroyed).toEqual(['a1', 'a2']);
    expect(chain.scrub).toBe(false);
    expect(fire(l, 2, -4, 'right').destroyed).toEqual(['a3']); // loner via y = 2x - 4
    expect(fire(l, 1, 0, 'right').scrub).toBe(true); // loner's easy y = x hits the ally
  });

  it('z7-l4: one line threads the shield, dodges the ally, and clears the chain', () => {
    const l = byId('z7-l4');
    const chain = fire(l, 0.5, 0, 'right'); // y = 0.5x under the shield, clear of the ally
    expect(chain.destroyed).toEqual(['a1', 'a2']);
    expect(chain.scrub).toBe(false);
    expect(fire(l, 1, 0, 'left').destroyed).toEqual(['a3']); // left rock, effective y = -x
    expect(fire(l, 1, 0, 'right').scrub).toBe(true); // y = x is scrubbed by the ally at (3,3)
  });

  it('z7-l5: chain clears; the loner’s shared-with-ally line is scrubbed', () => {
    const l = byId('z7-l5');
    expect(fire(l, 2, 0, 'right').destroyed).toEqual(['a1', 'a2']); // chain y = 2x
    expect(fire(l, 0.5, -1, 'right').destroyed).toEqual(['a3']); // loner via y = 0.5x - 1
    expect(fire(l, 1 / 3, 0, 'right').scrub).toBe(true); // y = x/3 passes the ally at (3,1)
  });
});
