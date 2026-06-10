import { describe, expect, it } from 'vitest';
import type { LevelStats } from './difficulty';
import { bankXp, computeRunXp, rankForXp, EMPTY_XP_STORE, type XpBonusId } from './xp';

function stats(overrides: Partial<LevelStats> = {}): LevelStats {
  return {
    levelId: 'z1-l1',
    tier: 'standard',
    targets: 2,
    shots: 4,
    hits: 2,
    misses: 2,
    offBoardShots: 0,
    multiHits: 0,
    accuracy: 0.5,
    startHearts: 5,
    heartsLost: 2,
    heartsRemaining: 3,
    losses: 0,
    manualResets: 0,
    attempts: 1,
    passedFirstTry: true,
    firstShotHit: false,
    trajectoryPreview: 'always',
    calculatorOpens: 0,
    tweaks: 0,
    durationMs: 1000,
    timeToFirstShotMs: 100,
    timeToFirstHitMs: 200,
    firstPlayedAt: 10,
    completedAt: 20,
    score: 0.5,
    ...overrides,
  };
}

const ids = (s: LevelStats, prior?: LevelStats): XpBonusId[] =>
  computeRunXp(s, prior).bonuses.map((b) => b.id);

describe('computeRunXp', () => {
  it('always awards the completion bonus', () => {
    const run = computeRunXp(stats());
    expect(ids(stats())).toEqual(['complete']);
    expect(run.runXp).toBe(50);
  });

  it('awards the doc bonus table for a flawless no-preview run', () => {
    const run = computeRunXp(
      stats({
        misses: 0,
        firstShotHit: true,
        multiHits: 1,
        trajectoryPreview: 'off',
      }),
    );
    expect(run.bonuses.map((b) => b.id)).toEqual([
      'complete',
      'first-shot-hit',
      'no-miss',
      'combo',
      'no-preview',
    ]);
    expect(run.runXp).toBe(50 + 25 + 50 + 30 + 50);
  });

  it('scales the combo bonus with the number of multi-hit shots', () => {
    const run = computeRunXp(stats({ multiHits: 2 }));
    expect(run.bonuses.find((b) => b.id === 'combo')?.points).toBe(60);
  });

  it('rewards finishing after running out of hearts', () => {
    expect(ids(stats({ losses: 1 }))).toContain('improved');
  });

  it('rewards a replay that beats the prior score', () => {
    expect(ids(stats({ score: 0.9 }), stats({ score: 0.5 }))).toContain('improved');
  });

  it('does not reward a replay that matches or drops the prior score', () => {
    expect(ids(stats({ score: 0.5 }), stats({ score: 0.5 }))).not.toContain('improved');
    expect(ids(stats({ score: 0.3 }), stats({ score: 0.5 }))).not.toContain('improved');
  });

  it('handles legacy stats without the newer optional fields', () => {
    const legacy = stats();
    delete (legacy as Partial<LevelStats>).firstShotHit;
    delete (legacy as Partial<LevelStats>).trajectoryPreview;
    expect(ids(legacy)).toEqual(['complete']);
  });

  it('never includes calculator or tweak signals in any bonus', () => {
    const heavyToolUse = stats({ calculatorOpens: 50, tweaks: 500 });
    expect(computeRunXp(heavyToolUse).runXp).toBe(computeRunXp(stats()).runXp);
  });
});

describe('bankXp', () => {
  it('banks the full run XP for a first clear', () => {
    const { store, award } = bankXp(EMPTY_XP_STORE, 'z1-l1', { bonuses: [], runXp: 100 });
    expect(award.awardedXp).toBe(100);
    expect(store.totalXp).toBe(100);
    expect(store.levelBestXp['z1-l1']).toBe(100);
  });

  it('banks only the improvement over the previous best run', () => {
    const first = bankXp(EMPTY_XP_STORE, 'z1-l1', { bonuses: [], runXp: 100 });
    const second = bankXp(first.store, 'z1-l1', { bonuses: [], runXp: 150 });
    expect(second.award.awardedXp).toBe(50);
    expect(second.store.totalXp).toBe(150);
    expect(second.store.levelBestXp['z1-l1']).toBe(150);
  });

  it('banks zero (and never subtracts) for a worse replay', () => {
    const first = bankXp(EMPTY_XP_STORE, 'z1-l1', { bonuses: [], runXp: 150 });
    const worse = bankXp(first.store, 'z1-l1', { bonuses: [], runXp: 50 });
    expect(worse.award.awardedXp).toBe(0);
    expect(worse.store.totalXp).toBe(150);
    expect(worse.store.levelBestXp['z1-l1']).toBe(150);
  });

  it('tracks bests per level so other levels still bank in full', () => {
    const first = bankXp(EMPTY_XP_STORE, 'z1-l1', { bonuses: [], runXp: 100 });
    const other = bankXp(first.store, 'z1-l2', { bonuses: [], runXp: 80 });
    expect(other.award.awardedXp).toBe(80);
    expect(other.store.totalXp).toBe(180);
  });
});

describe('rankForXp', () => {
  it('starts new pilots at Cadet with the next rank in sight', () => {
    expect(rankForXp(0)).toEqual({ name: 'Cadet', min: 0, nextMin: 500 });
    expect(rankForXp(499).name).toBe('Cadet');
  });

  it('promotes exactly at each threshold', () => {
    expect(rankForXp(500).name).toBe('Pilot');
    expect(rankForXp(1500).name).toBe('Ace');
    expect(rankForXp(3000).name).toBe('Commander');
  });

  it('caps at the top rank with no next threshold', () => {
    expect(rankForXp(5000)).toEqual({ name: 'Star Legend', min: 5000, nextMin: null });
    expect(rankForXp(99999).nextMin).toBeNull();
  });
});
