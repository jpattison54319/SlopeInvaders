import type { ArcadeRecords, ArcadeRunStats } from './types';

export const ARCADE_RECORDS_KEY = 'slope-invaders:arcade-records-v1';

export const EMPTY_ARCADE_RECORDS: ArcadeRecords = {
  highScore: 0,
  bestWave: 0,
  longestStreak: 0,
  totalRuns: 0,
  totalDestroyed: 0,
  totalPlaytimeMs: 0,
  lastRun: null,
};

export function mergeArcadeRun(
  records: ArcadeRecords,
  run: ArcadeRunStats,
): ArcadeRecords {
  return {
    highScore: Math.max(records.highScore, run.score),
    bestWave: Math.max(records.bestWave, run.wave),
    longestStreak: Math.max(records.longestStreak, run.longestStreak),
    totalRuns: records.totalRuns + 1,
    totalDestroyed: records.totalDestroyed + run.destroyed,
    totalPlaytimeMs: records.totalPlaytimeMs + run.durationMs,
    lastRun: run,
  };
}

export function loadArcadeRecords(): ArcadeRecords {
  try {
    const raw = localStorage.getItem(ARCADE_RECORDS_KEY);
    if (!raw) return EMPTY_ARCADE_RECORDS;
    const parsed = JSON.parse(raw) as Partial<ArcadeRecords>;
    return {
      highScore: Math.max(0, Number(parsed.highScore) || 0),
      bestWave: Math.max(0, Number(parsed.bestWave) || 0),
      longestStreak: Math.max(0, Number(parsed.longestStreak) || 0),
      totalRuns: Math.max(0, Number(parsed.totalRuns) || 0),
      totalDestroyed: Math.max(0, Number(parsed.totalDestroyed) || 0),
      totalPlaytimeMs: Math.max(0, Number(parsed.totalPlaytimeMs) || 0),
      lastRun: parsed.lastRun ?? null,
    };
  } catch {
    return EMPTY_ARCADE_RECORDS;
  }
}

export function saveArcadeRecords(records: ArcadeRecords): void {
  try {
    localStorage.setItem(ARCADE_RECORDS_KEY, JSON.stringify(records));
  } catch {
    /* local records are best-effort */
  }
}
