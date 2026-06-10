import { describe, expect, it } from 'vitest';
import type { LevelStats } from './difficulty';
import type { ProfileStats } from './profileStats';
import { BADGES, evaluateNewBadges, type BadgeContext, type EarnedBadges } from './badges';
import { zones } from './zones';

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

const profile: ProfileStats = {
  levelsCompleted: 1,
  totalShots: 4,
  totalHits: 2,
  totalMisses: 2,
  totalHeartsLost: 2,
  totalPlaytimeMs: 1000,
  totalCalculatorOpens: 0,
  totalAttempts: 1,
  firstPlayedAt: 10,
  lastPlayedAt: 20,
};

function ctx(overrides: Partial<BadgeContext> = {}): BadgeContext {
  return {
    stats: stats(),
    priorStats: undefined,
    completedLevelIds: new Set<string>(),
    stars: {},
    profile,
    ...overrides,
  };
}

const newIds = (c: BadgeContext, already: EarnedBadges = {}): string[] =>
  evaluateNewBadges(c, already).map((b) => b.id);

describe('badge registry', () => {
  it('has a concept badge for every available zone after the tutorial', () => {
    const conceptZoneIds = ['zone-1', 'zone-2', 'zone-3', 'zone-4', 'zone-5', 'zone-6', 'zone-7', 'zone-8'];
    for (const zoneId of conceptZoneIds) {
      // A renamed/removed zone must fail loudly here, not silently never award.
      expect(zones.some((z) => z.id === zoneId && z.levels.length > 0), zoneId).toBe(true);
    }
    expect(BADGES.filter((b) => b.category === 'concept')).toHaveLength(conceptZoneIds.length);
  });

  it('uses only positively framed names', () => {
    for (const badge of BADGES) {
      expect(badge.name).not.toMatch(/easy|needs|help|slow|fail/i);
    }
  });
});

describe('evaluateNewBadges', () => {
  it('awards the zone concept badge once every level of the zone is complete', () => {
    const zoneOne = zones.find((z) => z.id === 'zone-1')!;
    const allButLast = new Set(zoneOne.levels.slice(0, -1).map((l) => l.id));
    expect(newIds(ctx({ completedLevelIds: allButLast }))).not.toContain('slope-starter');

    const all = new Set(zoneOne.levels.map((l) => l.id));
    expect(newIds(ctx({ completedLevelIds: all }))).toContain('slope-starter');
  });

  it('awards Perfect Trajectory only on a no-miss run', () => {
    expect(newIds(ctx({ stats: stats({ misses: 0 }) }))).toContain('perfect-trajectory');
    expect(newIds(ctx({ stats: stats({ misses: 1 }) }))).not.toContain('perfect-trajectory');
  });

  it('awards Combo Pilot when one line destroyed multiple asteroids', () => {
    expect(newIds(ctx({ stats: stats({ multiHits: 1 }) }))).toContain('combo-pilot');
    expect(newIds(ctx())).not.toContain('combo-pilot');
  });

  it('awards No Preview Pilot only for a preview-off run', () => {
    expect(newIds(ctx({ stats: stats({ trajectoryPreview: 'off' }) }))).toContain('no-preview-pilot');
    expect(newIds(ctx({ stats: stats({ trajectoryPreview: 'after-fire' }) }))).not.toContain('no-preview-pilot');
    expect(newIds(ctx())).not.toContain('no-preview-pilot');
  });

  it('awards Comeback Cadet after winning despite running out of hearts', () => {
    expect(newIds(ctx({ stats: stats({ losses: 1 }) }))).toContain('comeback-cadet');
    // Manual resets are not failures and must not count.
    expect(newIds(ctx({ stats: stats({ manualResets: 3 }) }))).not.toContain('comeback-cadet');
  });

  it('awards Growth Streak for a replay that beats the prior score or stars', () => {
    expect(
      newIds(ctx({ stats: stats({ score: 0.9 }), priorStats: stats({ score: 0.5 }) })),
    ).toContain('growth-streak');
    expect(
      newIds(
        ctx({
          stats: stats({ misses: 1, heartsLost: 1, heartsRemaining: 4 }),
          priorStats: stats({ misses: 3, heartsLost: 3, heartsRemaining: 2 }),
        }),
      ),
    ).toContain('growth-streak');
    expect(
      newIds(ctx({ stats: stats({ score: 0.4 }), priorStats: stats({ score: 0.5 }) })),
    ).not.toContain('growth-streak');
    expect(newIds(ctx({ stats: stats({ score: 0.9 }) }))).not.toContain('growth-streak');
  });

  it('never re-awards an already-earned badge', () => {
    const c = ctx({ stats: stats({ misses: 0 }) });
    expect(newIds(c, { 'perfect-trajectory': 123 })).not.toContain('perfect-trajectory');
  });

  it('never keys any badge on calculator use or tweak counts', () => {
    const heavyToolUse = ctx({ stats: stats({ calculatorOpens: 50, tweaks: 500 }) });
    expect(newIds(heavyToolUse)).toEqual(newIds(ctx()));
  });
});
