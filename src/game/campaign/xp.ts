/**
 * Campaign XP (framework-free, unit-tested).
 *
 * XP rewards learning behavior — accuracy, strategy, and improvement — never
 * speed or grinding (docs/agent/03-gamification-multiplayer.md). Every win
 * computes a run's bonuses, but only the amount ABOVE the level's previous
 * best run is banked into the total ("best-run banking"): replaying a level
 * can only add XP by playing it better, and XP is never subtracted.
 */
import type { LevelStats } from './difficulty';

export type XpBonusId =
  | 'complete'
  | 'first-shot-hit'
  | 'no-miss'
  | 'combo'
  | 'no-preview'
  | 'improved';

/** One earned bonus, with the formative-feedback "why". */
export interface XpBonus {
  id: XpBonusId;
  label: string;
  points: number;
  reason: string;
}

/** The XP a single completed run earned, before banking. */
export interface XpRun {
  bonuses: XpBonus[];
  runXp: number;
}

/** Persisted XP state (localStorage `slope-invaders:xp`). */
export interface XpStore {
  totalXp: number;
  /** Best single-run XP seen per level — the banking baseline. */
  levelBestXp: Record<string, number>;
}

/** The result of banking a run: what was earned and what was newly banked. */
export interface XpAward extends XpRun {
  previousBestXp: number;
  /** XP actually added to the total this run (0 when the best run stands). */
  awardedXp: number;
  newTotalXp: number;
}

export const EMPTY_XP_STORE: XpStore = { totalXp: 0, levelBestXp: {} };

/** Pilot ranks unlocked by lifetime XP. XP never drops, so neither does rank. */
export interface PilotRank {
  name: string;
  /** XP where this rank begins. */
  min: number;
  /** XP where the next rank begins (null at the top rank). */
  nextMin: number | null;
}

const RANKS: ReadonlyArray<{ name: string; min: number }> = [
  { name: 'Cadet', min: 0 },
  { name: 'Pilot', min: 500 },
  { name: 'Ace', min: 1500 },
  { name: 'Commander', min: 3000 },
  { name: 'Star Legend', min: 5000 },
];

export function rankForXp(totalXp: number): PilotRank {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (totalXp >= RANKS[i].min) index = i;
  }
  return {
    name: RANKS[index].name,
    min: RANKS[index].min,
    nextMin: index + 1 < RANKS.length ? RANKS[index + 1].min : null,
  };
}

type XpStats = Pick<LevelStats, 'misses' | 'multiHits' | 'losses' | 'score'> &
  Pick<LevelStats, 'firstShotHit' | 'trajectoryPreview'>;

/**
 * Bonuses for one completed run. `prior` is the previous stored visit to the
 * same level (if any) so improvement can be recognized. Legacy stats without
 * the newer optional fields simply don't earn those bonuses.
 */
export function computeRunXp(stats: XpStats, prior?: XpStats): XpRun {
  const bonuses: XpBonus[] = [
    {
      id: 'complete',
      label: 'Mission complete',
      points: 50,
      reason: 'You cleared every asteroid in the level.',
    },
  ];

  if (stats.firstShotHit) {
    bonuses.push({
      id: 'first-shot-hit',
      label: 'First-shot hit',
      points: 25,
      reason: 'Your very first shot found its mark.',
    });
  }
  if (stats.misses === 0) {
    bonuses.push({
      id: 'no-miss',
      label: 'No-miss clear',
      points: 50,
      reason: 'Every shot you fired hit an asteroid.',
    });
  }
  if (stats.multiHits > 0) {
    bonuses.push({
      id: 'combo',
      label: 'Combo shot',
      points: 30 * stats.multiHits,
      reason:
        stats.multiHits === 1
          ? 'One line took out multiple asteroids at once.'
          : `${stats.multiHits} of your lines took out multiple asteroids at once.`,
    });
  }
  if (stats.trajectoryPreview === 'off') {
    bonuses.push({
      id: 'no-preview',
      label: 'No-preview clear',
      points: 50,
      reason: 'You aimed from the equation alone — no trajectory preview.',
    });
  }
  if (stats.losses > 0 || (prior !== undefined && stats.score > prior.score)) {
    bonuses.push({
      id: 'improved',
      label: 'Comeback & improve',
      points: 20,
      reason:
        stats.losses > 0
          ? 'You kept going after a setback and finished the mission.'
          : 'You replayed the level and flew it better than before.',
    });
  }

  return { bonuses, runXp: bonuses.reduce((sum, b) => sum + b.points, 0) };
}

/**
 * Bank a run against the level's best. Only the improvement over the previous
 * best run is added to the total — never subtracts, never rewards repetition.
 */
export function bankXp(
  store: XpStore,
  levelId: string,
  run: XpRun,
): { store: XpStore; award: XpAward } {
  const previousBestXp = store.levelBestXp[levelId] ?? 0;
  const awardedXp = Math.max(0, run.runXp - previousBestXp);
  const next: XpStore = {
    totalXp: store.totalXp + awardedXp,
    levelBestXp: { ...store.levelBestXp, [levelId]: Math.max(previousBestXp, run.runXp) },
  };
  return {
    store: next,
    award: { ...run, previousBestXp, awardedXp, newTotalXp: next.totalXp },
  };
}
