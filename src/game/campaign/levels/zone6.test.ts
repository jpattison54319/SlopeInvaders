import { describe, it, expect } from 'vitest';
import { zoneSix } from './zone6';
import { evaluateShot, resolveDestroyed, DEFAULT_HIT_TOLERANCE } from '../../logic/hitDetection';
import type { CampaignLevel } from '../types';
import type { AsteroidSpec, Facing } from '../../levels/types';

const byId = (id: string) => zoneSix.levels.find((l) => l.id === id)!;

/**
 * Fire a dialed (m, b, facing) shot at a Zone 6 level (ship at the origin) and
 * report what is actually destroyed after the linked-group all-or-none rule.
 * Mirrors Game.tsx: facing left negates the slope, walls are honored.
 */
function fire(level: CampaignLevel, m: number, b: number, facing: Facing) {
  const effM = facing === 'right' ? m : -m;
  const results = evaluateShot(
    effM,
    b,
    level.config.asteroids,
    0,
    DEFAULT_HIT_TOLERANCE,
    facing,
    level.config.walls,
  );
  const { destroyedIds, partialGroups } = resolveDestroyed(results, level.config.asteroids);
  return {
    destroyed: [...destroyedIds].sort(),
    partialGroups,
    blocked: results.filter((r) => r.blocked).map((r) => r.asteroidId),
  };
}

function groupsByLink(asteroids: AsteroidSpec[]): AsteroidSpec[][] {
  const map = new Map<string, AsteroidSpec[]>();
  for (const a of asteroids) {
    if (!a.linkGroup) continue;
    const g = map.get(a.linkGroup);
    if (g) g.push(a);
    else map.set(a.linkGroup, [a]);
  }
  return [...map.values()];
}

function collinear(pts: { x: number; y: number }[]): boolean {
  if (pts.length < 3) return true;
  const [p, q] = pts;
  return pts.every((r) => Math.abs((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x)) < 1e-9);
}

describe('zone 6 structure', () => {
  it('is an available zone of five levels using the full-grid (facing) controls', () => {
    expect(zoneSix.id).toBe('zone-6');
    expect(zoneSix.status).toBe('available');
    expect(zoneSix.levels.map((l) => l.id)).toEqual(['z6-l1', 'z6-l2', 'z6-l3', 'z6-l4', 'z6-l5']);
    expect(byId('z6-l1').config.allowedControls).toEqual(['slope', 'yIntercept', 'direction']);
  });

  it('z6-l1 is the fixed diagnostic with one chained pair; the rest are adaptive', () => {
    expect(byId('z6-l1').adaptive).toBeUndefined();
    const groups = groupsByLink(byId('z6-l1').config.asteroids);
    expect(groups.length).toBe(1);
    expect(groups[0].length).toBe(2);
    for (const id of ['z6-l2', 'z6-l3', 'z6-l4', 'z6-l5']) expect(byId(id).adaptive).toBe(true);
    expect(byId('z6-l5').config.trajectoryPreview).toBe('after-fire');
  });

  it('every linked group is collinear, so it is solvable with one line', () => {
    for (const level of zoneSix.levels) {
      for (const group of groupsByLink(level.config.asteroids)) {
        expect(collinear(group.map((a) => a.weakPoint)), `${level.id} ${group[0].linkGroup}`).toBe(true);
      }
    }
  });

  it('includes the True/False all-or-none reflection', () => {
    const q = zoneSix.reflections?.find((r) => /one rock now and the other later/i.test(r.prompt));
    expect(q?.options).toEqual(['True', 'False']);
    expect(q?.correctIndex).toBe(1); // "False"
  });
});

describe('zone 6 solvability — one line clears a chain, a partial clip clears nothing', () => {
  it('z6-l1: y = 0.5x clears both links; a one-rock line destroys nothing', () => {
    const l = byId('z6-l1');
    expect(fire(l, 0.5, 0, 'right').destroyed).toEqual(['a1', 'a2']);
    const partial = fire(l, 0, 1, 'right'); // y = 1 hits (2,1) only
    expect(partial.destroyed).toEqual([]);
    expect(partial.partialGroups).toEqual(['chain-1']);
  });

  it('z6-l2: a chain on each side, cleared by facing the right way', () => {
    const l = byId('z6-l2');
    expect(fire(l, 1, 0, 'right').destroyed).toEqual(['a1', 'a2']); // y = x
    expect(fire(l, 1, 0, 'left').destroyed).toEqual(['a3', 'a4']); // effective y = -x
  });

  it('z6-l3: two chains and a loner each have their own line', () => {
    const l = byId('z6-l3');
    expect(fire(l, 1, 0, 'right').destroyed).toEqual(['a1', 'a2']); // chain a: y = x
    expect(fire(l, -0.5, 5, 'right').destroyed).toEqual(['a3', 'a4']); // chain b: y = -0.5x + 5
    expect(fire(l, 2, 0, 'right').destroyed).toEqual(['a5']); // loner: y = 2x
  });

  it('z6-l4: the chain line runs clear; a shield rules out the loner’s easy line', () => {
    const l = byId('z6-l4');
    expect(fire(l, 0.5, 0, 'right').destroyed).toEqual(['a1', 'a2']); // chain y = 0.5x (not blocked)
    expect(fire(l, 0.5, 2, 'right').destroyed).toEqual(['a3']); // loner via y = 0.5x + 2 (over the wall)
    expect(fire(l, 1, 0, 'right').blocked).toContain('a3'); // lazy y = x is blocked
  });

  it('z6-l5: both chains clear; a shield blocks an over-steep guess, a half-clip fails', () => {
    const l = byId('z6-l5');
    expect(fire(l, 0.5, 0, 'right').destroyed).toEqual(['a1', 'a2']); // right chain y = 0.5x
    expect(fire(l, 1, 0, 'left').destroyed).toEqual(['a3', 'a4']); // left chain effective y = -x
    expect(fire(l, 0, 1, 'right').partialGroups).toEqual(['right']); // y = 1 clips one link only
  });
});
