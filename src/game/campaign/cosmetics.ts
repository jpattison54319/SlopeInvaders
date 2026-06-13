/**
 * Cosmetic rewards (framework-free, unit-tested).
 *
 * Personalization-only unlockables: ship hulls, laser styles, and board/UI
 * themes. They are earned by *learning behaviour* — clearing zones, banking
 * lifetime XP, collecting mastery stars, or earning a badge — and never by
 * grinding, speed, or tool use (docs/agent/03-gamification-multiplayer.md).
 *
 * Critically, cosmetics are purely visual: equipping a ship/laser/theme NEVER
 * changes hit detection, scoring, hearts, adaptivity, or any pedagogy. They
 * exist to give learners a reason to come back and a way to make their cockpit
 * their own — especially as the trophy for beating a zone.
 *
 * This module is pure data + helpers. Earned-state persistence lives in
 * useCampaignProgress; the equipped selection lives in useLoadout.
 */

import type { ShipSpriteKey } from '../../assets/assetMap';

export type CosmeticKind = 'ship' | 'laser' | 'theme';

/** What a learner must do to unlock an item (declarative so we can show hints). */
export type UnlockRule =
  | { type: 'default' }
  | { type: 'zone'; zoneId: string }
  | { type: 'xp'; amount: number }
  | { type: 'stars'; count: number }
  | { type: 'badge'; badgeId: string };

interface BaseCosmetic {
  id: string;
  kind: CosmeticKind;
  name: string;
  description: string;
  unlock: UnlockRule;
}

/** A ship hull: picks a distinct sprite and an optional hue rotation. */
export interface ShipSkin extends BaseCosmetic {
  kind: 'ship';
  /** Which hull sprite to draw (see assetMap `shipSprites`). */
  sprite: ShipSpriteKey;
  /** Hue rotation in degrees applied to the sprite (0 = original colours). */
  hue: number;
}

/** A projectile style: beam colour/width plus the bolt-head hue. */
export interface LaserStyle extends BaseCosmetic {
  kind: 'laser';
  /** Outer glow colour of the firing beam. */
  beam: string;
  /** Bright inner core colour. */
  beamCore: string;
  /** Outer beam stroke width in px. */
  width: number;
  /** Hue rotation applied to the bolt-head sprite (0 = original). */
  boltHue: number;
}

/** A theme: board background + app accent colours. */
export interface ThemeStyle extends BaseCosmetic {
  kind: 'theme';
  /** Konva board background fill. */
  space: string;
  /** App accent (overrides --cyan). */
  accent: string;
  /** Secondary accent (overrides --amber). */
  amber: string;
  /** Page background gradient stops (override --space-0 / --space-1). */
  gradient: [string, string];
}

export type CosmeticItem = ShipSkin | LaserStyle | ThemeStyle;

/** Everything the unlock rules look at, captured AFTER a completion. */
export interface UnlockContext {
  /** Ids of zones whose every level is complete. */
  clearedZoneIds: ReadonlySet<string>;
  /** Lifetime banked XP. */
  totalXp: number;
  /** Sum of best mastery stars across all levels. */
  totalStars: number;
  /** Ids of earned badges. */
  earnedBadgeIds: ReadonlySet<string>;
}

// --- Catalog --------------------------------------------------------------
// One reward lands for clearing every zone (z1–z9), with a few XP/stars/badge
// items mixed in for breadth. Hues are degrees relative to the green sprites.

const SHIPS: readonly ShipSkin[] = [
  {
    id: 'ship-scout',
    kind: 'ship',
    name: 'Scout',
    description: 'The standard-issue cadet cannon. Reliable and ready.',
    unlock: { type: 'default' },
    sprite: 'scout',
    hue: 0,
  },
  {
    id: 'ship-falcon',
    kind: 'ship',
    name: 'Falcon',
    description: 'A sleek arrow-class interceptor. First hull off the rack.',
    unlock: { type: 'zone', zoneId: 'zone-1' },
    sprite: 'falcon',
    hue: 0,
  },
  {
    id: 'ship-crimson',
    kind: 'ship',
    name: 'Crimson Diver',
    description: 'A red battle-cruiser for pilots who chase falling lines into Quadrant IV.',
    unlock: { type: 'zone', zoneId: 'zone-3' },
    sprite: 'crimson',
    hue: 0,
  },
  {
    id: 'ship-azure',
    kind: 'ship',
    name: 'Azure Lance',
    description: 'A cool-blue strike fighter earned by threading shots past every shield.',
    unlock: { type: 'zone', zoneId: 'zone-5' },
    sprite: 'azure',
    hue: 0,
  },
  {
    id: 'ship-nebula',
    kind: 'ship',
    name: 'Nebula Wing',
    description: 'A wide-winged stealth cruiser for guardians of the friendly fleet.',
    unlock: { type: 'zone', zoneId: 'zone-7' },
    sprite: 'nebula',
    hue: 0,
  },
  {
    id: 'ship-phantom',
    kind: 'ship',
    name: 'Golden Phantom',
    description: 'A gold alien dreadnought — the Equation Forge masterwork for pilots who type their own lines.',
    unlock: { type: 'zone', zoneId: 'zone-9' },
    sprite: 'phantom',
    hue: 0,
  },
];

const LASERS: readonly LaserStyle[] = [
  {
    id: 'laser-cyan',
    kind: 'laser',
    name: 'Cyan Bolt',
    description: 'The classic ion beam. Crisp and bright.',
    unlock: { type: 'default' },
    beam: '#5ef1ff',
    beamCore: '#ffffff',
    width: 4,
    boltHue: 0,
  },
  {
    id: 'laser-ember',
    kind: 'laser',
    name: 'Ember Lance',
    description: 'A warm orange bolt unlocked by mastering the y-intercept.',
    unlock: { type: 'zone', zoneId: 'zone-2' },
    beam: '#ff8c42',
    beamCore: '#ffe9a8',
    width: 4,
    boltHue: 150,
  },
  {
    id: 'laser-plasma',
    kind: 'laser',
    name: 'Plasma Coil',
    description: 'A magenta chain-cutter earned by clearing linked asteroids.',
    unlock: { type: 'zone', zoneId: 'zone-6' },
    beam: '#ff5ed6',
    beamCore: '#ffe1f7',
    width: 5,
    boltHue: 230,
  },
  {
    id: 'laser-verdant',
    kind: 'laser',
    name: 'Verdant Ray',
    description: 'A green beam awarded for banking 1,200 lifetime XP.',
    unlock: { type: 'xp', amount: 1200 },
    beam: '#5dff9a',
    beamCore: '#e6ffe9',
    width: 4,
    boltHue: 90,
  },
  {
    id: 'laser-gold',
    kind: 'laser',
    name: 'Solar Flare',
    description: 'A golden beam earned by clearing a level with no missed shots.',
    unlock: { type: 'badge', badgeId: 'perfect-trajectory' },
    beam: '#ffd166',
    beamCore: '#fff6d6',
    width: 5,
    boltHue: 180,
  },
];

const THEMES: readonly ThemeStyle[] = [
  {
    id: 'theme-deepspace',
    kind: 'theme',
    name: 'Deep Space',
    description: 'The default cyan-on-navy command palette.',
    unlock: { type: 'default' },
    space: '#070b20',
    accent: '#5ef1ff',
    amber: '#ffd166',
    gradient: ['#060818', '#0a0e27'],
  },
  {
    id: 'theme-aurora',
    kind: 'theme',
    name: 'Aurora',
    description: 'A teal-green sweep earned by commanding the full grid.',
    unlock: { type: 'zone', zoneId: 'zone-4' },
    space: '#04140f',
    accent: '#39d98a',
    amber: '#7cffb2',
    gradient: ['#02110c', '#06231a'],
  },
  {
    id: 'theme-inferno',
    kind: 'theme',
    name: 'Inferno',
    description: 'A molten red bridge earned by steering the moving cannon.',
    unlock: { type: 'zone', zoneId: 'zone-8' },
    space: '#1a0708',
    accent: '#ff7a4d',
    amber: '#ffb347',
    gradient: ['#180406', '#2a0a0c'],
  },
  {
    id: 'theme-void',
    kind: 'theme',
    name: 'Void Bloom',
    description: 'A purple nebula palette unlocked at 24 mastery stars.',
    unlock: { type: 'stars', count: 24 },
    space: '#10081f',
    accent: '#b78bff',
    amber: '#ff9cf0',
    gradient: ['#0c0518', '#1a0b2e'],
  },
  {
    id: 'theme-solaris',
    kind: 'theme',
    name: 'Solaris',
    description: 'A radiant gold command deck earned at 2,500 lifetime XP.',
    unlock: { type: 'xp', amount: 2500 },
    space: '#1a1407',
    accent: '#ffd166',
    amber: '#ffe9a8',
    gradient: ['#171204', '#241a06'],
  },
];

export const COSMETICS: readonly CosmeticItem[] = [...SHIPS, ...LASERS, ...THEMES];

/** Default equipped item per kind (always unlocked). */
export const DEFAULT_LOADOUT = {
  ship: 'ship-scout',
  laser: 'laser-cyan',
  theme: 'theme-deepspace',
} as const;

export function getCosmetic(id: string): CosmeticItem | undefined {
  return COSMETICS.find((c) => c.id === id);
}

export function cosmeticsByKind<K extends CosmeticKind>(
  kind: K,
): ReadonlyArray<Extract<CosmeticItem, { kind: K }>> {
  return COSMETICS.filter(
    (c): c is Extract<CosmeticItem, { kind: K }> => c.kind === kind,
  );
}

/** True when the unlock rule is satisfied by the current context. */
export function isUnlocked(item: CosmeticItem, ctx: UnlockContext): boolean {
  const rule = item.unlock;
  switch (rule.type) {
    case 'default':
      return true;
    case 'zone':
      return ctx.clearedZoneIds.has(rule.zoneId);
    case 'xp':
      return ctx.totalXp >= rule.amount;
    case 'stars':
      return ctx.totalStars >= rule.count;
    case 'badge':
      return ctx.earnedBadgeIds.has(rule.badgeId);
  }
}

/** Items that the context unlocks but which `ownedIds` does not yet contain. */
export function evaluateNewUnlocks(
  ctx: UnlockContext,
  ownedIds: ReadonlySet<string>,
): CosmeticItem[] {
  return COSMETICS.filter((item) => !ownedIds.has(item.id) && isUnlocked(item, ctx));
}

const KIND_NOUN: Record<CosmeticKind, string> = {
  ship: 'Ship',
  laser: 'Laser',
  theme: 'Theme',
};

export function kindNoun(kind: CosmeticKind): string {
  return KIND_NOUN[kind];
}

/** A short human description of how an item is unlocked (for locked cards). */
export function describeUnlock(rule: UnlockRule): string {
  switch (rule.type) {
    case 'default':
      return 'Unlocked from the start';
    case 'zone': {
      if (rule.zoneId === 'tutorial') return 'Complete the Tutorial';
      const n = rule.zoneId.replace('zone-', '');
      return `Clear Zone ${n}`;
    }
    case 'xp':
      return `Bank ${rule.amount.toLocaleString()} lifetime XP`;
    case 'stars':
      return `Earn ${rule.count} mastery stars`;
    case 'badge':
      return 'Earn the Perfect Trajectory badge';
  }
}
