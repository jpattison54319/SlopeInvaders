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
    const d = selectTier([]);
    expect(d.tier).toBe('standard');
    expect(d.sampleCount).toBe(0);
    expect(Number.isNaN(d.ema)).toBe(true);
    expect(d.scores).toEqual([]);
  });

  it('promotes strong performers to challenge', () => {
    const d = selectTier([0.9, 0.95]);
    expect(d.tier).toBe('challenge');
    expect(d.sampleCount).toBe(2);
    expect(d.ema).toBeGreaterThanOrEqual(0.75);
  });

  it('drops strugglers to support', () => {
    const d = selectTier([0.2, 0.3]);
    expect(d.tier).toBe('support');
    expect(d.ema).toBeLessThanOrEqual(0.45);
  });

  it('keeps middling performers at standard', () => {
    const d = selectTier([0.6]);
    expect(d.tier).toBe('standard');
  });

  it('weighs recent levels most (recovery from a rough start)', () => {
    const d = selectTier([0.2, 0.2, 0.95, 0.95]);
    expect(d.tier).toBe('challenge');
  });

  it('records weights whose weighted sum equals the reported EMA', () => {
    // Improvement #7: weights are an explicit transparency signal.
    const d = selectTier([0.1, 0.2, 0.3]);
    expect(d.weights).toHaveLength(3);
    // Weights must sum to exactly 1 (true convex combination).
    const sum = d.weights.reduce((a, w) => a + w, 0);
    expect(sum).toBeCloseTo(1, 6);
    // The most recent score carries the largest weight, and each prior score
    // decays by (1 - alpha).
    expect(d.weights[2]).toBeGreaterThan(d.weights[1]);
    expect(d.weights[1]).toBeGreaterThan(d.weights[0]);
    // Recomputed EMA from weights should match the reported EMA exactly.
    const weighted = d.scores.reduce((sum, s, i) => sum + s * d.weights[i], 0);
    expect(weighted).toBeCloseTo(d.ema, 6);
  });

  it('weights favor the most recent score by a factor of alpha each step', () => {
    // alpha = 0.6: most recent gets 0.6, next gets 0.24, then 0.096, ...
    const d = selectTier([0, 0, 0, 0.5]);
    expect(d.weights[3]).toBeCloseTo(0.6, 6);
    expect(d.weights[2]).toBeCloseTo(0.24, 6);
    expect(d.weights[1]).toBeCloseTo(0.096, 6);
  });

  it('echoes the thresholds the engine used for the decision', () => {
    const d = selectTier([0.6]);
    expect(d.thresholds).toEqual({ challenge: 0.75, support: 0.45 });
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

  it('lockTrajectoryPreview forces preview off across all tiers', () => {
    const lvl = campaignLevel({
      id: 'l_locked',
      adaptive: true,
    });
    lvl.config.lockTrajectoryPreview = true;
    lvl.config.trajectoryPreview = 'always';
    
    const cSupport = configForTier(lvl, 'support');
    const cStandard = configForTier(lvl, 'standard');
    const cChallenge = configForTier(lvl, 'challenge');
    
    expect(cSupport.trajectoryPreview).toBe('off');
    expect(cStandard.trajectoryPreview).toBe('off');
    expect(cChallenge.trajectoryPreview).toBe('off');
  });
});
