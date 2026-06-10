import { describe, expect, it } from 'vitest';
import type { LevelStats } from '../game/campaign/difficulty';
import type { ProfileStats } from '../game/campaign/profileStats';
import { buildProgressPayload, type ProgressSnapshot } from './progressPayload';

function levelStats(overrides: Partial<LevelStats> = {}): LevelStats {
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
    startHearts: 3,
    heartsLost: 0,
    heartsRemaining: 3,
    losses: 0,
    manualResets: 0,
    attempts: 1,
    passedFirstTry: true,
    calculatorOpens: 0,
    tweaks: 0,
    durationMs: 1000,
    timeToFirstShotMs: 500,
    timeToFirstHitMs: 600,
    firstPlayedAt: 1000,
    completedAt: 2000,
    score: 1,
    ...overrides,
  };
}

const profile: ProfileStats = {
  levelsCompleted: 2,
  totalShots: 5,
  totalHits: 4,
  totalMisses: 1,
  totalHeartsLost: 1,
  totalPlaytimeMs: 4000,
  totalCalculatorOpens: 0,
  totalAttempts: 2,
  firstPlayedAt: 1000,
  lastPlayedAt: 5000,
};

describe('buildProgressPayload', () => {
  it('maps the summary from profile + XP and derives the rank', () => {
    const snap: ProgressSnapshot = {
      profile,
      totalXp: 1500,
      levelStats: {},
      levelStars: {},
      completedLevelIds: [],
    };
    const { summary } = buildProgressPayload(snap);
    expect(summary.levelsCompleted).toBe(2);
    expect(summary.totalShots).toBe(5);
    expect(summary.totalXp).toBe(1500);
    expect(summary.rank).toBe('Ace'); // 1500 XP threshold
    expect(summary.lastPlayedAt).toBe(5000);
  });

  it('sums total stars across completed levels (explicit + derived)', () => {
    const snap: ProgressSnapshot = {
      profile,
      totalXp: 0,
      levelStats: { 'z1-l2': levelStats({ levelId: 'z1-l2', misses: 1 }) },
      levelStars: { 'z1-l1': 3 },
      completedLevelIds: ['z1-l1', 'z1-l2'],
    };
    // z1-l1: explicit 3; z1-l2: derived (misses=1 -> 2 stars)
    expect(buildProgressPayload(snap).summary.totalStars).toBe(5);
  });

  it('includes per-level detail only for completions with rich stats', () => {
    const snap: ProgressSnapshot = {
      profile,
      totalXp: 0,
      levelStats: { 'z1-l1': levelStats() },
      levelStars: {},
      completedLevelIds: ['z1-l1', 'legacy-no-stats'],
    };
    const { levels } = buildProgressPayload(snap);
    expect(levels).toHaveLength(1);
    expect(levels[0]).toMatchObject({ levelId: 'z1-l1', stars: 3, attempts: 1 });
  });
});
