import { describe, expect, it } from 'vitest';
import {
  COSMETICS,
  DEFAULT_LOADOUT,
  cosmeticsByKind,
  describeUnlock,
  evaluateNewUnlocks,
  getCosmetic,
  isUnlocked,
  type UnlockContext,
} from './cosmetics';

const EMPTY: UnlockContext = {
  clearedZoneIds: new Set(),
  totalXp: 0,
  totalStars: 0,
  earnedBadgeIds: new Set(),
};

describe('cosmetics catalog', () => {
  it('has unique ids', () => {
    const ids = COSMETICS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('default loadout items exist and are unlocked from the start', () => {
    for (const id of Object.values(DEFAULT_LOADOUT)) {
      const item = getCosmetic(id);
      expect(item).toBeDefined();
      expect(isUnlocked(item!, EMPTY)).toBe(true);
    }
  });

  it('exposes at least one item per kind', () => {
    expect(cosmeticsByKind('ship').length).toBeGreaterThan(0);
    expect(cosmeticsByKind('laser').length).toBeGreaterThan(0);
    expect(cosmeticsByKind('theme').length).toBeGreaterThan(0);
  });
});

describe('isUnlocked', () => {
  it('locks zone rewards until the zone is cleared', () => {
    const falcon = getCosmetic('ship-falcon')!;
    expect(isUnlocked(falcon, EMPTY)).toBe(false);
    expect(
      isUnlocked(falcon, { ...EMPTY, clearedZoneIds: new Set(['zone-1']) }),
    ).toBe(true);
  });

  it('honours xp thresholds', () => {
    const verdant = getCosmetic('laser-verdant')!;
    expect(isUnlocked(verdant, { ...EMPTY, totalXp: 1199 })).toBe(false);
    expect(isUnlocked(verdant, { ...EMPTY, totalXp: 1200 })).toBe(true);
  });

  it('honours star thresholds', () => {
    const voidTheme = getCosmetic('theme-void')!;
    expect(isUnlocked(voidTheme, { ...EMPTY, totalStars: 23 })).toBe(false);
    expect(isUnlocked(voidTheme, { ...EMPTY, totalStars: 24 })).toBe(true);
  });

  it('honours badge requirements', () => {
    const gold = getCosmetic('laser-gold')!;
    expect(isUnlocked(gold, EMPTY)).toBe(false);
    expect(
      isUnlocked(gold, { ...EMPTY, earnedBadgeIds: new Set(['perfect-trajectory']) }),
    ).toBe(true);
  });
});

describe('evaluateNewUnlocks', () => {
  it('returns only newly satisfied, not-yet-owned items', () => {
    const owned = new Set(Object.values(DEFAULT_LOADOUT));
    const ctx: UnlockContext = { ...EMPTY, clearedZoneIds: new Set(['zone-1']) };
    const fresh = evaluateNewUnlocks(ctx, owned);
    expect(fresh.map((c) => c.id)).toEqual(['ship-falcon']);
  });

  it('does not re-award an already-owned item', () => {
    const ctx: UnlockContext = { ...EMPTY, clearedZoneIds: new Set(['zone-1']) };
    const owned = new Set([...Object.values(DEFAULT_LOADOUT), 'ship-falcon']);
    expect(evaluateNewUnlocks(ctx, owned)).toEqual([]);
  });
});

describe('describeUnlock', () => {
  it('describes each rule type', () => {
    expect(describeUnlock({ type: 'default' })).toMatch(/start/i);
    expect(describeUnlock({ type: 'zone', zoneId: 'zone-3' })).toBe('Clear Zone 3');
    expect(describeUnlock({ type: 'zone', zoneId: 'tutorial' })).toMatch(/tutorial/i);
    expect(describeUnlock({ type: 'xp', amount: 1200 })).toMatch(/1,200/);
    expect(describeUnlock({ type: 'stars', count: 24 })).toMatch(/24/);
    expect(describeUnlock({ type: 'badge', badgeId: 'perfect-trajectory' })).toMatch(/badge/i);
  });
});
