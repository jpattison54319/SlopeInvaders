import { describe, expect, it } from 'vitest';
import {
  buildVersusAsteroids,
  buildVersusLevel,
  makeAddedAsteroids,
  mulberry32,
  spawnItem,
  VERSUS_HEARTS,
  VERSUS_START_ASTEROIDS,
} from './field';

describe('mulberry32', () => {
  it('is deterministic and in [0, 1)', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 20; i++) {
      const v = a();
      expect(v).toBe(b());
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('buildVersusAsteroids', () => {
  it('is deterministic per seed and never places one on the origin', () => {
    const a = buildVersusAsteroids(42);
    const b = buildVersusAsteroids(42);
    expect(a).toEqual(b);
    expect(a).toHaveLength(VERSUS_START_ASTEROIDS);
    for (const ast of a) {
      expect(ast.weakPoint.x === 0 && ast.weakPoint.y === 0).toBe(false);
    }
  });

  it('differs across seeds', () => {
    expect(buildVersusAsteroids(1)).not.toEqual(buildVersusAsteroids(2));
  });
});

describe('buildVersusLevel', () => {
  it('is an all-quadrants duel with slope/intercept/facing and hearts', () => {
    const level = buildVersusLevel(7);
    expect(level.quadrantMode).toBe('all-quadrants');
    expect(level.allowedControls).toEqual(['slope', 'yIntercept', 'direction']);
    expect(level.hearts).toBe(VERSUS_HEARTS);
    expect(level.ship.position).toEqual({ x: 0, y: 0 });
    expect(level.trajectoryPreview).toBe('off');
  });
});

describe('attack helpers', () => {
  it('makeAddedAsteroids returns N targets avoiding taken cells', () => {
    const rng = mulberry32(9);
    const taken = new Set<string>(['1,1']);
    const added = makeAddedAsteroids(rng, taken, 2);
    expect(added).toHaveLength(2);
    for (const a of added) expect(`${a.weakPoint.x},${a.weakPoint.y}`).not.toBe('1,1');
  });

  it('spawnItem yields a valid kind on an open cell', () => {
    const item = spawnItem(mulberry32(3), new Set(), 1000);
    expect(item).not.toBeNull();
    expect(['add', 'freeze']).toContain(item!.kind);
    expect(item!.expiresAt).toBeGreaterThan(1000);
  });
});
