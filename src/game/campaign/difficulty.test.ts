import { describe, expect, it } from 'vitest';
import {
  configForTier,
  scorePerformance,
  selectTier,
  type LevelStats,
  type ScorableStats,
} from './difficulty';
import type { CampaignLevel } from './types';
import { slopeLevel } from './levels/helpers';
import { zoneTwo } from './levels/zone2';
import { zoneThree } from './levels/zone3';
import { zoneFour } from './levels/zone4';
import { zoneFive } from './levels/zone5';

/** A full LevelStats with sensible defaults, overridable per test. */
function stats(over: Partial<LevelStats> = {}): LevelStats {
  return {
    levelId: 'x',
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
    firstPlayedAt: 0,
    completedAt: 1000,
    score: 0,
    ...over,
  };
}

function campaignLevel(over: Partial<CampaignLevel> & Pick<CampaignLevel, 'id'>): CampaignLevel {
  return {
    name: over.id,
    subtitle: '',
    config: slopeLevel({
      id: over.id,
      name: over.id,
      learningGoal: 'test',
      asteroids: [{ id: 'a1', weakPoint: { x: 2, y: 4 } }],
      hearts: 4,
    }),
    ...over,
  };
}

describe('scorePerformance', () => {
  it('rewards a flawless clear with a high score', () => {
    expect(scorePerformance(stats())).toBeCloseTo(1, 5);
  });

  it('punishes wasted shots, lost hearts, and deaths', () => {
    const s = scorePerformance(
      stats({ targets: 2, shots: 10, startHearts: 4, heartsLost: 4, losses: 2 }),
    );
    expect(s).toBeLessThanOrEqual(0.45);
    expect(s).toBeGreaterThanOrEqual(0);
  });

  it('stays within [0, 1] for extreme inputs', () => {
    const bad: ScorableStats = { targets: 1, shots: 999, startHearts: 1, heartsLost: 99, losses: 9 };
    expect(scorePerformance(bad)).toBeGreaterThanOrEqual(0);
    expect(scorePerformance(bad)).toBeLessThanOrEqual(1);
  });

  it('is independent of calculator opens and tweaks (calculator is free)', () => {
    const lots = stats({ calculatorOpens: 50, tweaks: 200 });
    const none = stats({ calculatorOpens: 0, tweaks: 0 });
    expect(scorePerformance(lots)).toBe(scorePerformance(none));
  });

  it('treats non-finite startHearts as no heart penalty', () => {
    const s = scorePerformance(stats({ startHearts: Infinity, heartsLost: 0 }));
    expect(s).toBeCloseTo(1, 5);
  });
});

describe('selectTier', () => {
  it('defaults to standard with no data', () => {
    expect(selectTier([])).toBe('standard');
  });

  it('promotes strong performers to challenge', () => {
    expect(selectTier([0.9, 0.95])).toBe('challenge');
  });

  it('drops strugglers to support', () => {
    expect(selectTier([0.2, 0.3])).toBe('support');
  });

  it('keeps middling performers at standard', () => {
    expect(selectTier([0.6])).toBe('standard');
  });

  it('weighs recent levels most (recovery from a rough start)', () => {
    expect(selectTier([0.2, 0.2, 0.95, 0.95])).toBe('challenge');
  });
});

describe('configForTier', () => {
  it('returns the authored config for non-adaptive levels', () => {
    const lvl = campaignLevel({ id: 'l1' }); // adaptive omitted
    expect(configForTier(lvl, 'challenge')).toBe(lvl.config);
    expect(configForTier(lvl, 'support')).toBe(lvl.config);
  });

  it('returns the authored config at the standard tier', () => {
    const lvl = campaignLevel({ id: 'l2', adaptive: true });
    expect(configForTier(lvl, 'standard')).toBe(lvl.config);
  });

  it('support adds a heart and forces full scaffolds', () => {
    const lvl = campaignLevel({ id: 'l2', adaptive: true });
    const c = configForTier(lvl, 'support');
    expect(c.hearts).toBe(5); // base 4 + 1
    expect(c.trajectoryPreview).toBe('always');
    expect(c.trajectoryStyle).toBe('normal');
    expect(c.showCoordinates).toBe(true);
  });

  it('challenge removes a heart and steps the scaffold ladder up one rung', () => {
    const lvl = campaignLevel({ id: 'l2', adaptive: true }); // base always/normal
    const c = configForTier(lvl, 'challenge');
    expect(c.hearts).toBe(3); // base 4 - 1
    expect(c.trajectoryPreview).toBe('always');
    expect(c.trajectoryStyle).toBe('dimmed'); // rung 0 -> rung 1
  });

  it('challenge on an after-fire level removes the preview entirely', () => {
    const lvl = campaignLevel({ id: 'l4', adaptive: true });
    lvl.config.trajectoryPreview = 'after-fire';
    lvl.config.hearts = 3;
    const c = configForTier(lvl, 'challenge');
    expect(c.trajectoryPreview).toBe('off');
    expect(c.hearts).toBe(2);
  });

  it('never drops below one heart', () => {
    const lvl = campaignLevel({ id: 'lx', adaptive: true });
    lvl.config.hearts = 1;
    expect(configForTier(lvl, 'challenge').hearts).toBe(1);
  });

  it('merges per-tier variant overrides last (e.g. extra asteroid)', () => {
    const extra = [
      { id: 'a1', weakPoint: { x: 2, y: 4 } },
      { id: 'a2', weakPoint: { x: 4, y: 2 } },
    ];
    const lvl = campaignLevel({
      id: 'l2',
      adaptive: true,
      variants: { challenge: { asteroids: extra } },
    });
    const c = configForTier(lvl, 'challenge');
    expect(c.asteroids).toHaveLength(2);
    expect(c.hearts).toBe(3); // rule delta still applies
  });

  it('applies the authored Zone 2 challenge variant (z2-l2 adds a third target)', () => {
    const z2l2 = zoneTwo.levels.find((l) => l.id === 'z2-l2')!;
    expect(z2l2.config.asteroids).toHaveLength(2); // standard tier
    const c = configForTier(z2l2, 'challenge');
    expect(c.asteroids).toHaveLength(3); // challenge variant adds the off-row target
    expect(c.hearts).toBe(3); // base 4 - 1
  });

  it('applies the authored Zone 3 challenge variant (z3-l2 adds a third descent)', () => {
    const z3l2 = zoneThree.levels.find((l) => l.id === 'z3-l2')!;
    expect(z3l2.config.asteroids).toHaveLength(2); // standard tier
    const c = configForTier(z3l2, 'challenge');
    expect(c.asteroids).toHaveLength(3); // challenge variant adds a steeper descent
    expect(c.hearts).toBe(3); // base 4 - 1
  });

  it('applies the authored Zone 4 challenge variant (z4-l2 adds a fifth target)', () => {
    const z4l2 = zoneFour.levels.find((l) => l.id === 'z4-l2')!;
    expect(z4l2.config.asteroids).toHaveLength(4); // standard tier (1 per quadrant)
    const c = configForTier(z4l2, 'challenge');
    expect(c.asteroids).toHaveLength(5); // challenge variant adds one
    expect(c.hearts).toBe(3); // base 4 - 1
  });

  it('applies the authored Zone 5 challenge variant (z5-l2 adds a third target)', () => {
    const z5l2 = zoneFive.levels.find((l) => l.id === 'z5-l2')!;
    expect(z5l2.config.asteroids).toHaveLength(2); // standard tier
    const c = configForTier(z5l2, 'challenge');
    expect(c.asteroids).toHaveLength(3); // challenge variant adds a fortified target
    expect(c.hearts).toBe(3); // base 4 - 1
  });
});
