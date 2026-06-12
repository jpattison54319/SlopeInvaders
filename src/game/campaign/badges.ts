/**
 * Campaign badges (framework-free, unit-tested).
 *
 * Badges reward concept mastery, strategy, and growth — never speed, grinding,
 * or tool use, and no badge labels a student negatively
 * (docs/agent/03-gamification-multiplayer.md). Once earned, a badge is never
 * revoked. Evaluation runs on each level completion over the just-finished
 * run, the previous stored run, and the overall campaign state.
 */
import type { LevelStats } from './difficulty';
import type { ProfileStats } from './profileStats';
import { starsForCompletedStats, type StarCount } from './stars';
import { zones } from './zones';

export type BadgeCategory = 'concept' | 'performance' | 'growth';

/** Everything a badge condition may look at, captured AFTER the completion. */
export interface BadgeContext {
  /** The just-completed run. */
  stats: LevelStats;
  /** The previous stored run for this level, if it was completed before. */
  priorStats?: LevelStats;
  /** All completed level ids, including the one just finished. */
  completedLevelIds: ReadonlySet<string>;
  /** Best mastery stars per level id. */
  stars: Record<string, StarCount>;
  /** Lifetime profile aggregates, including this completion. */
  profile: ProfileStats;
}

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  /** For concept badges: the zone whose planet art is the badge emblem. */
  zoneId?: string;
  earned: (ctx: BadgeContext) => boolean;
}

/** Earned badges: badge id → epoch ms when first earned. */
export type EarnedBadges = Record<string, number>;

/** A concept badge earned by completing every level of a zone. */
function zoneBadge(zoneId: string, id: string, name: string, description: string): BadgeDef {
  return {
    id,
    name,
    description,
    category: 'concept',
    zoneId,
    earned: (ctx) => {
      const zone = zones.find((z) => z.id === zoneId);
      return (
        !!zone &&
        zone.levels.length > 0 &&
        zone.levels.every((l) => ctx.completedLevelIds.has(l.id))
      );
    },
  };
}

export const BADGES: readonly BadgeDef[] = [
  // --- concept badges: one per zone cleared ---
  zoneBadge('zone-1', 'slope-starter', 'Slope Starter', 'Cleared Zone 1 — you can aim with slope alone.'),
  zoneBadge('zone-2', 'intercept-initiate', 'Intercept Initiate', 'Cleared Zone 2 — you lift lines with the y-intercept.'),
  zoneBadge('zone-3', 'negative-slope-navigator', 'Negative Slope Navigator', 'Cleared Zone 3 — falling lines hold no fear.'),
  zoneBadge('zone-4', 'quadrant-explorer', 'Quadrant Explorer', 'Cleared Zone 4 — you command the full coordinate grid.'),
  zoneBadge('zone-5', 'shield-breaker', 'Shield Breaker', 'Cleared Zone 5 — you find the lines that slip past every wall.'),
  zoneBadge('zone-6', 'point-to-point-pilot', 'Point-to-Point Pilot', 'Cleared Zone 6 — two points, one line, every time.'),
  zoneBadge('zone-7', 'friendly-fleet-protector', 'Friendly Fleet Protector', 'Cleared Zone 7 — sharp shots that keep allies safe.'),
  zoneBadge('zone-8', 'cannon-commander', 'Cannon Commander', 'Cleared Zone 8 — you steer the cannon itself with y = m(x − h) + b.'),
  zoneBadge('zone-9', 'equation-author', 'Equation Author', 'Cleared Zone 9 — you type the full equation y = m(x − h) + b from scratch.'),

  // --- performance badges: strategy on a single run ---
  {
    id: 'perfect-trajectory',
    name: 'Perfect Trajectory',
    description: 'Clear a level without a single missed shot.',
    category: 'performance',
    earned: (ctx) => ctx.stats.misses === 0,
  },
  {
    id: 'combo-pilot',
    name: 'Combo Pilot',
    description: 'Take out two or more asteroids with one line.',
    category: 'performance',
    earned: (ctx) => ctx.stats.multiHits >= 1,
  },
  {
    id: 'no-preview-pilot',
    name: 'No Preview Pilot',
    description: 'Clear a level aiming from the equation alone — no trajectory preview.',
    category: 'performance',
    earned: (ctx) => ctx.stats.trajectoryPreview === 'off',
  },

  // --- growth badges: self-regulated learning behavior ---
  {
    id: 'comeback-cadet',
    name: 'Comeback Cadet',
    description: 'Run out of hearts, regroup, and finish the mission anyway.',
    category: 'growth',
    earned: (ctx) => ctx.stats.losses >= 1,
  },
  {
    id: 'growth-streak',
    name: 'Growth Streak',
    description: 'Replay a level and fly it better than before.',
    category: 'growth',
    earned: (ctx) =>
      !!ctx.priorStats &&
      (ctx.stats.score > ctx.priorStats.score ||
        starsForCompletedStats(ctx.stats) > starsForCompletedStats(ctx.priorStats)),
  },
];

/** Badges newly earned by this completion (already-earned ones never re-fire). */
export function evaluateNewBadges(ctx: BadgeContext, already: EarnedBadges): BadgeDef[] {
  return BADGES.filter((badge) => !(badge.id in already) && badge.earned(ctx));
}
