import { describe, it, expect } from 'vitest';
import { zoneFive } from './zone5';
import { evaluateShot, DEFAULT_HIT_TOLERANCE } from '../../logic/hitDetection';
import type { CampaignLevel } from '../types';
import type { Facing } from '../../levels/types';

const byId = (id: string) => zoneFive.levels.find((l) => l.id === id)!;

/**
 * Fire a dialed (m, b, facing) shot at a level (ship at the origin) and report
 * which asteroids are hit vs blocked. Mirrors Game.tsx: facing left negates the
 * effective slope (y = -m·x + b), and walls are honored.
 */
function shoot(level: CampaignLevel, m: number, b: number, facing: Facing) {
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
  return {
    hit: results.filter((r) => r.hit).map((r) => r.asteroidId),
    blocked: results.filter((r) => r.blocked).map((r) => r.asteroidId),
  };
}

describe('zone 5 structure', () => {
  it('is registered as an available zone with five levels', () => {
    expect(zoneFive.id).toBe('zone-5');
    expect(zoneFive.status).toBe('available');
    expect(zoneFive.levels.map((l) => l.id)).toEqual(['z5-l1', 'z5-l2', 'z5-l3', 'z5-l4', 'z5-l5']);
  });

  it('uses the full-grid config and every level has walls', () => {
    const cfg = byId('z5-l1').config;
    expect(cfg.quadrantMode).toBe('all-quadrants');
    expect(cfg.equationForm).toBe('y=mx+b');
    expect(cfg.allowedControls).toEqual(['slope', 'yIntercept', 'direction']);
    for (const level of zoneFive.levels) {
      expect(level.config.walls.length, `${level.id} should have walls`).toBeGreaterThan(0);
    }
  });

  it('includes angled (non-vertical) shields, not only vertical walls', () => {
    const angled = zoneFive.levels
      .flatMap((l) => l.config.walls)
      .filter((w) => w.from.x !== w.to.x && w.from.y !== w.to.y);
    expect(angled.length, 'expected at least one diagonal/angled wall in the zone').toBeGreaterThan(0);
    // Each angled shield should be a true 45° (|slope| = 1) wall.
    for (const w of angled) {
      const slope = (w.to.y - w.from.y) / (w.to.x - w.from.x);
      expect(Math.abs(slope)).toBeCloseTo(1, 9);
    }
  });

  it('z5-l1 is the fixed diagnostic; the rest are adaptive', () => {
    expect(byId('z5-l1').adaptive).toBeUndefined();
    for (const id of ['z5-l2', 'z5-l3', 'z5-l4', 'z5-l5']) {
      expect(byId(id).adaptive).toBe(true);
    }
  });

  it('includes the True/False "many equations" reflection', () => {
    const q = zoneFive.reflections?.find((r) => /only one possible equation/i.test(r.prompt));
    expect(q?.options).toEqual(['True', 'False']);
    expect(q?.correctIndex).toBe(1); // "False"
  });
});

describe('zone 5 solvability — intended lines reach, tempting lines are blocked', () => {
  it('z5-l1: y = x - 3 threads past the wall; y = 0.5x is blocked', () => {
    const l = byId('z5-l1');
    expect(shoot(l, 1, -3, 'right').hit).toEqual(['a1']);
    expect(shoot(l, 0.5, 0, 'right').blocked).toEqual(['a1']);
  });

  it('z5-l2: sloped lines clear both; the flat line is blocked', () => {
    const l = byId('z5-l2');
    expect(shoot(l, 1, 0, 'right').hit).toContain('a1'); // y = x
    expect(shoot(l, 0.5, -2, 'right').hit).toContain('a2'); // y = 0.5x - 2
    expect(shoot(l, 0, 4, 'right').blocked).toContain('a1'); // flat y = 4 blocked
  });

  it('z5-l3: the 45° shield blocks the y = x diagonal; a steeper line clears (5,5); face left for (-4,2)', () => {
    const l = byId('z5-l3');
    expect(shoot(l, 2, -5, 'right').hit).toContain('a1'); // y = 2x - 5 slips past the angled wall
    expect(shoot(l, 0.5, 0, 'left').hit).toContain('a2'); // effective y = -0.5x
    expect(shoot(l, 1, 0, 'right').blocked).toContain('a1'); // diagonal y = x blocked by the 45° shield
  });

  it('z5-l4: a gentle slope threads the boxed-in target; flat + steep are blocked', () => {
    const l = byId('z5-l4');
    expect(shoot(l, 0.5, 0, 'right').hit).toEqual(['a1']); // y = 0.5x
    expect(shoot(l, 0, 2, 'right').blocked).toEqual(['a1']); // flat blocked
    expect(shoot(l, 2, -6, 'right').blocked).toEqual(['a1']); // steep blocked
  });

  it('z5-l5: each fortified asteroid has a clear line; the angled shield blocks (4,-4)’s diagonal', () => {
    const l = byId('z5-l5');
    expect(shoot(l, 1, -3, 'right').hit).toContain('a1'); // y = x - 3
    expect(shoot(l, 0.5, 0, 'left').hit).toContain('a2'); // effective y = -0.5x
    expect(shoot(l, -2, 4, 'right').hit).toContain('a3'); // y = -2x + 4 rounds the 45° shield
    expect(shoot(l, -1, 0, 'right').blocked).toContain('a3'); // diagonal y = -x blocked
  });
});
