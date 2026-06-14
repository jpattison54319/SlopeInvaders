import { describe, expect, it } from 'vitest';
import {
  buildVersusAsteroids,
  buildVersusLevel,
  makeAddedAsteroids,
  mulberry32,
  spawnItem,
  versusShotGeometry,
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
    expect(level.allowedControls).toEqual(['slope', 'yIntercept', 'xOffset', 'direction']);
    expect(level.defaults.xOffset).toBe(0);
    expect(level.hearts).toBe(VERSUS_HEARTS);
    expect(level.ship.position).toEqual({ x: 0, y: 0 });
    expect(level.trajectoryPreview).toBe('off');
  });
});

describe('versusShotGeometry', () => {
  it('matches campaign moving-cannon geometry in both facing directions', () => {
    expect(versusShotGeometry(2, 3, 4, 'right')).toEqual({
      shipX: 4,
      fireM: 2,
      fireB: -5,
    });
    expect(versusShotGeometry(2, 3, 4, 'left')).toEqual({
      shipX: 4,
      fireM: -2,
      fireB: 11,
    });
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

  it.each([
    { roll: 0, kind: 'add' },
    { roll: 0.499999, kind: 'add' },
    { roll: 0.5, kind: 'freeze' },
    { roll: 0.999999, kind: 'freeze' },
  ] as const)('uses an exact 50/50 item split for roll $roll', ({ roll, kind }) => {
    const values = [0.6, 0.6, roll];
    const item = spawnItem(() => values.shift() ?? 0, new Set(), 1000);

    expect(item).toMatchObject({
      point: { x: 2, y: 2 },
      kind,
      expiresAt: 1000 + 6000,
    });
  });
});
