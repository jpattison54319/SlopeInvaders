import { describe, expect, it } from 'vitest';
import { evaluateArcadeShot } from './collision';
import type { ArcadeAsteroid } from './types';

function asteroid(overrides: Partial<ArcadeAsteroid> = {}): ArcadeAsteroid {
  return {
    id: 'a1',
    x: 4,
    y: 4,
    phase: 'holding',
    vertexIndex: 1,
    fromY: 4,
    toY: 4,
    phaseElapsedMs: 0,
    phaseDurationMs: 5000,
    vertices: [7, 4, 1, -2, -5],
    ...overrides,
  };
}

describe('arcade swept collision', () => {
  it('hits a parked asteroid when the projectile reaches its center', () => {
    const result = evaluateArcadeShot(
      { x: 0, y: 0 },
      { x: 8, y: 8 },
      700,
      [asteroid()],
      5000,
    );
    expect(result.collisions).toHaveLength(1);
    expect(result.collisions[0].moving).toBe(false);
  });

  it('hits a moving asteroid between vertices', () => {
    const result = evaluateArcadeShot(
      { x: 0, y: 0 },
      { x: 8, y: 11.2 },
      700,
      [
        asteroid({
          phase: 'falling',
          y: 7,
          vertexIndex: 0,
          fromY: 7,
          toY: 4,
          phaseDurationMs: 750,
        }),
      ],
      5000,
    );
    expect(result.collisions).toHaveLength(1);
    expect(result.collisions[0].moving).toBe(true);
  });

  it('reports a near miss without inventing a collision', () => {
    const result = evaluateArcadeShot(
      { x: 0, y: 0 },
      { x: 8, y: 0 },
      700,
      [asteroid({ y: 1, fromY: 1, toY: 1 })],
      5000,
    );
    expect(result.collisions).toHaveLength(0);
    expect(result.nearest?.distance).toBeCloseTo(1);
  });

  it('can resolve multiple targets on the same shot path', () => {
    const result = evaluateArcadeShot(
      { x: 0, y: 0 },
      { x: 8, y: 8 },
      700,
      [asteroid(), asteroid({ id: 'a2', x: 6, y: 6, fromY: 6, toY: 6 })],
      5000,
    );
    expect(result.collisions.map((hit) => hit.asteroidId)).toEqual(['a1', 'a2']);
  });

  it('blocks a shot when the shot crosses a relative orbital wall', () => {
    const blockedResult = evaluateArcadeShot(
      { x: 0, y: 0 },
      { x: 8, y: 8 },
      700,
      [
        asteroid({
          walls: [{ from: { x: -0.7, y: -0.7 }, to: { x: -0.7, y: 0.7 } }],
        }),
      ],
      5000,
    );
    expect(blockedResult.collisions).toHaveLength(0);

    const clearResult = evaluateArcadeShot(
      { x: 8, y: 4 },
      { x: 0, y: 4 },
      700,
      [
        asteroid({
          walls: [{ from: { x: -0.7, y: -0.7 }, to: { x: -0.7, y: 0.7 } }],
        }),
      ],
      5000,
    );
    expect(clearResult.collisions).toHaveLength(1);
  });
});
