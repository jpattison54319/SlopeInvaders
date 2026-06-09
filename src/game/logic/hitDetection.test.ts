import { describe, it, expect } from 'vitest';
import {
  evaluateAsteroid,
  evaluateShot,
  segmentIntersection,
  isPathBlocked,
  firstWallHit,
  firstFriendlyHit,
  hitsFriendly,
  resolveDestroyed,
} from './hitDetection';
import type { AsteroidSpec, FriendlySpec, WallSpec } from '../levels/types';

const asteroids: AsteroidSpec[] = [
  { id: 'a1', weakPoint: { x: 2, y: 2 } },
  { id: 'a2', weakPoint: { x: 6, y: 3 } },
  { id: 'a3', weakPoint: { x: 3, y: 7 } },
];

describe('evaluateAsteroid', () => {
  it('hits an asteroid the line passes through', () => {
    const r = evaluateAsteroid(1, 0, asteroids[0], 0); // y = x through (2,2)
    expect(r.hit).toBe(true);
    expect(r.missDistance).toBe(0);
    expect(r.lineYAtX).toBe(2);
  });

  it('misses an asteroid off the line and reports the gap', () => {
    const r = evaluateAsteroid(1, 0, asteroids[2], 0); // y = x at x=3 -> 3, target y=7
    expect(r.hit).toBe(false);
    expect(r.lineYAtX).toBe(3);
    expect(r.missDistance).toBe(4);
  });

  it('does not hit asteroids behind the cannon', () => {
    const r = evaluateAsteroid(1, 0, asteroids[0], 5); // fromX=5 excludes x=2
    expect(r.hit).toBe(false);
  });
});

describe('evaluateShot', () => {
  it('hits exactly the targeted asteroid with y = 2x + 1', () => {
    const results = evaluateShot(2, 1, asteroids, 0); // passes through (3,7) only
    const hits = results.filter((r) => r.hit).map((r) => r.asteroidId);
    expect(hits).toEqual(['a3']);
  });

  it('the default line y = x hits only (2,2)', () => {
    const results = evaluateShot(1, 0, asteroids, 0);
    const hits = results.filter((r) => r.hit).map((r) => r.asteroidId);
    expect(hits).toEqual(['a1']);
  });
});

describe('facing direction (Zone 4)', () => {
  // y = x passes through both (2,2) on the right and (-3,-3) on the left.
  const right: AsteroidSpec = { id: 'r', weakPoint: { x: 2, y: 2 } };
  const left: AsteroidSpec = { id: 'l', weakPoint: { x: -3, y: -3 } };

  it('facing right hits the right-side target and not the left', () => {
    expect(evaluateAsteroid(1, 0, right, 0, undefined, 'right').hit).toBe(true);
    expect(evaluateAsteroid(1, 0, left, 0, undefined, 'right').hit).toBe(false);
  });

  it('facing left hits the left-side target and not the right', () => {
    expect(evaluateAsteroid(1, 0, left, 0, undefined, 'left').hit).toBe(true);
    expect(evaluateAsteroid(1, 0, right, 0, undefined, 'left').hit).toBe(false);
  });

  it('defaults to facing right when omitted', () => {
    expect(evaluateAsteroid(1, 0, right, 0).hit).toBe(true);
    expect(evaluateAsteroid(1, 0, left, 0).hit).toBe(false);
  });
});

describe('walls (Zone 5)', () => {
  it('segmentIntersection finds a crossing and returns null when there is none', () => {
    const p = segmentIntersection({ x: 0, y: 0 }, { x: 4, y: 4 }, { x: 2, y: 0 }, { x: 2, y: 4 });
    expect(p).toEqual({ x: 2, y: 2 });
    // Parallel / non-crossing segments → null.
    expect(segmentIntersection({ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 1 }, { x: 4, y: 1 })).toBeNull();
    expect(segmentIntersection({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 5, y: 0 }, { x: 5, y: 4 })).toBeNull();
  });

  const wall: WallSpec = { id: 'w', from: { x: 2, y: 1 }, to: { x: 2, y: 3 } };

  it('isPathBlocked is true when a wall crosses the path, false otherwise', () => {
    // y = x from (0,0) to (4,4) crosses x=2 at y=2, inside the wall (1..3).
    expect(isPathBlocked({ x: 0, y: 0 }, { x: 4, y: 4 }, [wall])).toBe(true);
    // A path that crosses x=2 at y=0 (below the wall) is clear.
    expect(isPathBlocked({ x: 0, y: -2 }, { x: 4, y: 2 }, [wall])).toBe(false);
    expect(firstWallHit({ x: 0, y: 0 }, { x: 4, y: 4 }, [wall])).toEqual({ x: 2, y: 2 });
  });

  it('a gap in the wall lets the shot through', () => {
    const gapped: WallSpec = { ...wall, gaps: [{ from: { x: 2, y: 1.5 }, to: { x: 2, y: 2.5 } }] };
    // The crossing at (2,2) lands inside the gap → not blocked.
    expect(isPathBlocked({ x: 0, y: 0 }, { x: 4, y: 4 }, [gapped])).toBe(false);
  });

  it('evaluateAsteroid marks an on-line target blocked when a wall is in the way', () => {
    const target: AsteroidSpec = { id: 't', weakPoint: { x: 4, y: 4 } };
    const r = evaluateAsteroid(1, 0, target, 0, undefined, 'right', [wall]);
    expect(r.hit).toBe(false);
    expect(r.blocked).toBe(true);
    // Same target, no walls → hit.
    expect(evaluateAsteroid(1, 0, target, 0, undefined, 'right', []).hit).toBe(true);
  });

  it('evaluateShot excludes blocked asteroids from hits', () => {
    const targets: AsteroidSpec[] = [
      { id: 'near', weakPoint: { x: 1, y: 1 } }, // before the wall (x=2)
      { id: 'far', weakPoint: { x: 4, y: 4 } }, // behind the wall
    ];
    const results = evaluateShot(1, 0, targets, 0, undefined, 'right', [wall]);
    expect(results.find((r) => r.asteroidId === 'near')!.hit).toBe(true);
    expect(results.find((r) => r.asteroidId === 'far')!.hit).toBe(false);
    expect(results.find((r) => r.asteroidId === 'far')!.blocked).toBe(true);
  });
});

describe('linked groups — all-or-none (Zone 6)', () => {
  // A chained pair on y = 0.5x, plus a solo on y = x.
  const linked: AsteroidSpec[] = [
    { id: 'c1', weakPoint: { x: 2, y: 1 }, linkGroup: 'chain' },
    { id: 'c2', weakPoint: { x: 6, y: 3 }, linkGroup: 'chain' },
    { id: 's1', weakPoint: { x: 4, y: 4 } },
  ];

  it('destroys the whole chain when one line hits every member', () => {
    const results = evaluateShot(0.5, 0, linked, 0); // y = 0.5x through (2,1) and (6,3)
    const { destroyedIds, partialGroups } = resolveDestroyed(results, linked);
    expect([...destroyedIds].sort()).toEqual(['c1', 'c2']);
    expect(partialGroups).toEqual([]);
  });

  it('destroys nothing and flags the group when only part of a chain is hit', () => {
    const results = evaluateShot(0, 1, linked, 0); // y = 1 hits (2,1) only
    const { destroyedIds, partialGroups } = resolveDestroyed(results, linked);
    expect(destroyedIds.size).toBe(0);
    expect(partialGroups).toEqual(['chain']);
  });

  it('destroys a solo independently of any chain', () => {
    const results = evaluateShot(1, 0, linked, 0); // y = x hits the solo (4,4) only
    const { destroyedIds, partialGroups } = resolveDestroyed(results, linked);
    expect([...destroyedIds]).toEqual(['s1']);
    expect(partialGroups).toEqual([]);
  });
});

describe('friendly ships (Zone 7)', () => {
  const friendly: FriendlySpec = { id: 'f', position: { x: 4, y: 4 } };

  it('hitsFriendly is true when the line crosses an ally in range, false otherwise', () => {
    expect(hitsFriendly(1, 0, friendly, 0)).toBe(true); // y = x through (4,4)
    expect(hitsFriendly(2, -2, friendly, 0)).toBe(false); // y = 2x - 2 → 6 at x=4
    // Facing left can't reach an ally on the right.
    expect(hitsFriendly(1, 0, friendly, 0, undefined, 'left')).toBe(false);
  });

  it('a wall in front of an ally shields it from the shot', () => {
    const wall: WallSpec = { id: 'w', from: { x: 2, y: 1 }, to: { x: 2, y: 3 } };
    expect(hitsFriendly(1, 0, friendly, 0, undefined, 'right', [wall])).toBe(false);
  });

  it('firstFriendlyHit returns the nearest ally on the beam, or null when clear', () => {
    expect(firstFriendlyHit({ x: 0, y: 0 }, { x: 8, y: 8 }, [friendly])).toEqual({ x: 4, y: 4 });
    expect(firstFriendlyHit({ x: 0, y: -2 }, { x: 8, y: 6 }, [friendly])).toBeNull();
  });
});
