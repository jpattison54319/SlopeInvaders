import { describe, expect, it } from 'vitest';
import { multiplierForStreak, scoreArcadeHit } from './scoring';

describe('arcade scoring', () => {
  it('uses the documented streak tiers', () => {
    expect(multiplierForStreak(2)).toBe(1);
    expect(multiplierForStreak(3)).toBe(1.5);
    expect(multiplierForStreak(6)).toBe(2);
    expect(multiplierForStreak(10)).toBe(3);
  });

  it('adds moving and multi-hit bonuses before the multiplier', () => {
    expect(scoreArcadeHit(2, [{ moving: true }, { moving: false }])).toEqual({
      points: 450,
      streak: 4,
      multiplier: 1.5,
      awards: [225, 225],
    });
  });

  it('returns the exact award displayed for each destroyed asteroid', () => {
    expect(scoreArcadeHit(0, [{ moving: false }]).awards).toEqual([100]);
    expect(scoreArcadeHit(0, [{ moving: true }]).awards).toEqual([150]);
    expect(scoreArcadeHit(0, [{ moving: false }, { moving: false }])).toEqual({
      points: 250,
      streak: 2,
      multiplier: 1,
      awards: [100, 150],
    });
  });
});
