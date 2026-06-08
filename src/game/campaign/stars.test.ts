import { describe, expect, it } from 'vitest';
import type { LevelStats } from './difficulty';
import { starsForCompletedStats, starsForLevel, type StarCount } from './stars';

function stats(overrides: Partial<LevelStats> = {}): LevelStats {
  return {
    levelId: 'z1-l1',
    tier: 'standard',
    targets: 2,
    shots: 2,
    hits: 2,
    misses: 0,
    offBoardShots: 0,
    multiHits: 0,
    accuracy: 1,
    startHearts: 5,
    heartsLost: 0,
    heartsRemaining: 5,
    losses: 0,
    manualResets: 0,
    attempts: 1,
    passedFirstTry: true,
    calculatorOpens: 0,
    tweaks: 0,
    durationMs: 1000,
    timeToFirstShotMs: 100,
    timeToFirstHitMs: 200,
    firstPlayedAt: 10,
    completedAt: 20,
    score: 1,
    ...overrides,
  };
}

describe('campaign mastery stars', () => {
  it('awards three stars for a perfect full-hearts clear', () => {
    expect(starsForCompletedStats(stats())).toBe(3);
  });

  it('awards two stars for a clear with one miss', () => {
    expect(starsForCompletedStats(stats({ misses: 1, heartsLost: 1, heartsRemaining: 4 }))).toBe(2);
  });

  it('awards one star when a completed run has two or more misses', () => {
    expect(starsForCompletedStats(stats({ misses: 2, heartsLost: 2, heartsRemaining: 3 }))).toBe(1);
  });

  it('awards one legacy star for completed levels without stored stats', () => {
    expect(starsForLevel(true)).toBe(1);
  });

  it('awards zero stars for uncompleted levels', () => {
    expect(starsForLevel(false, stats())).toBe<StarCount>(0);
  });
});
