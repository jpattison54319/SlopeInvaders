import type { LevelStats } from './difficulty';

export type StarCount = 0 | 1 | 2 | 3;

type StarStats = Pick<LevelStats, 'misses' | 'startHearts' | 'heartsLost' | 'heartsRemaining'>;

export function starsForCompletedStats(stats: StarStats): Exclude<StarCount, 0> {
  if (stats.misses === 0 && stats.heartsLost === 0 && stats.heartsRemaining === stats.startHearts) {
    return 3;
  }
  if (stats.misses <= 1) return 2;
  return 1;
}

export function starsForLevel(completed: boolean, stats?: StarStats): StarCount {
  if (!completed) return 0;
  return stats ? starsForCompletedStats(stats) : 1;
}
