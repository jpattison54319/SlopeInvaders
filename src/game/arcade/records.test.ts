import { describe, expect, it } from 'vitest';
import { EMPTY_ARCADE_RECORDS, mergeArcadeRun } from './records';

describe('arcade records', () => {
  it('keeps personal bests while accumulating lifetime totals', () => {
    const first = mergeArcadeRun(EMPTY_ARCADE_RECORDS, {
      score: 900,
      wave: 3,
      longestStreak: 5,
      destroyed: 11,
      shots: 15,
      misses: 4,
      durationMs: 60000,
      endedAt: 10,
    });
    const second = mergeArcadeRun(first, {
      score: 500,
      wave: 2,
      longestStreak: 8,
      destroyed: 7,
      shots: 10,
      misses: 3,
      durationMs: 30000,
      endedAt: 20,
    });

    expect(second).toMatchObject({
      highScore: 900,
      bestWave: 3,
      longestStreak: 8,
      totalRuns: 2,
      totalDestroyed: 18,
      totalPlaytimeMs: 90000,
    });
  });
});
