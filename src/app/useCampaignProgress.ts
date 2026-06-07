import { useCallback, useMemo, useState } from 'react';
import { zones } from '../game/campaign/zones';
import type { Zone } from '../game/campaign/types';
import {
  scorePerformance,
  selectTier,
  type DifficultyTier,
  type LevelStats,
} from '../game/campaign/difficulty';

const STORAGE_KEY = 'slope-invaders:campaign-progress';
const STATS_KEY = 'slope-invaders:level-stats';
const PROFILE_KEY = 'slope-invaders:profile-stats';

/** Lifetime, cross-level totals — derived from the per-level stats, persisted
 * for a future learner profile / statistics page. */
export interface ProfileStats {
  levelsCompleted: number;
  totalShots: number;
  totalHits: number;
  totalMisses: number;
  totalHeartsLost: number;
  totalPlaytimeMs: number;
  totalCalculatorOpens: number;
  totalAttempts: number;
  firstPlayedAt: number | null;
  lastPlayedAt: number | null;
}

function loadCompleted(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { completedLevels?: string[] };
    return Array.isArray(parsed.completedLevels) ? parsed.completedLevels : [];
  } catch {
    return [];
  }
}

function saveCompleted(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completedLevels: ids }));
  } catch {
    /* ignore (private mode / unavailable storage) */
  }
}

function clearStoredProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATS_KEY);
    localStorage.removeItem(PROFILE_KEY);
  } catch {
    /* ignore */
  }
}

function loadStats(): Record<string, LevelStats> {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, LevelStats>) : {};
  } catch {
    return {};
  }
}

const EMPTY_PROFILE: ProfileStats = {
  levelsCompleted: 0,
  totalShots: 0,
  totalHits: 0,
  totalMisses: 0,
  totalHeartsLost: 0,
  totalPlaytimeMs: 0,
  totalCalculatorOpens: 0,
  totalAttempts: 0,
  firstPlayedAt: null,
  lastPlayedAt: null,
};

/** Build a profile from legacy per-level stats when no profile store exists. */
function aggregateLatestStats(stats: Record<string, LevelStats>): ProfileStats {
  const all = Object.values(stats);
  const playedTimes = all.map((s) => s.firstPlayedAt).filter((n) => Number.isFinite(n));
  return {
    levelsCompleted: all.length,
    totalShots: all.reduce((n, s) => n + s.shots, 0),
    totalHits: all.reduce((n, s) => n + s.hits, 0),
    totalMisses: all.reduce((n, s) => n + s.misses, 0),
    totalHeartsLost: all.reduce((n, s) => n + s.heartsLost, 0),
    totalPlaytimeMs: all.reduce((n, s) => n + s.durationMs, 0),
    totalCalculatorOpens: all.reduce((n, s) => n + s.calculatorOpens, 0),
    totalAttempts: all.reduce((n, s) => n + s.attempts, 0),
    firstPlayedAt: playedTimes.length ? Math.min(...playedTimes) : null,
    lastPlayedAt: all.length ? Math.max(...all.map((s) => s.completedAt)) : null,
  };
}

function saveStats(stats: Record<string, LevelStats>): void {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch {
    /* ignore */
  }
}

function loadProfile(): ProfileStats {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return aggregateLatestStats(loadStats());
    const parsed = JSON.parse(raw) as Partial<ProfileStats>;
    return { ...EMPTY_PROFILE, ...parsed };
  } catch {
    return aggregateLatestStats(loadStats());
  }
}

function saveProfile(profile: ProfileStats): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* ignore */
  }
}

function addCompletionToProfile(prev: ProfileStats, stats: LevelStats): ProfileStats {
  return {
    levelsCompleted: prev.levelsCompleted + 1,
    totalShots: prev.totalShots + stats.shots,
    totalHits: prev.totalHits + stats.hits,
    totalMisses: prev.totalMisses + stats.misses,
    totalHeartsLost: prev.totalHeartsLost + stats.heartsLost,
    totalPlaytimeMs: prev.totalPlaytimeMs + stats.durationMs,
    totalCalculatorOpens: prev.totalCalculatorOpens + stats.calculatorOpens,
    totalAttempts: prev.totalAttempts + stats.attempts,
    firstPlayedAt:
      prev.firstPlayedAt === null
        ? stats.firstPlayedAt
        : Math.min(prev.firstPlayedAt, stats.firstPlayedAt),
    lastPlayedAt:
      prev.lastPlayedAt === null ? stats.completedAt : Math.max(prev.lastPlayedAt, stats.completedAt),
  };
}

const availableZones = zones.filter((z) => z.status === 'available');

export interface CampaignProgress {
  isLevelComplete: (levelId: string) => boolean;
  isLevelUnlocked: (zone: Zone, index: number) => boolean;
  isZoneUnlocked: (zoneId: string) => boolean;
  isZoneComplete: (zoneId: string) => boolean;
  zoneClearedCount: (zoneId: string) => number;
  /** Mark a level complete; optionally records its rich stats. */
  markComplete: (levelId: string, stats?: LevelStats) => void;
  /** The difficulty tier a level should be played at (rolling adaptivity). */
  tierForLevel: (zone: Zone, index: number) => DifficultyTier;
  getLevelStats: (levelId: string) => LevelStats | undefined;
  getProfileStats: () => ProfileStats;
  resetProgress: () => void;
}

/**
 * Tracks completed campaign levels + per-level stats in localStorage and derives
 * (a) the sequential-unlock rules and (b) the rolling difficulty tier for each
 * level. A level unlocks when its predecessor is complete; a zone unlocks when
 * the previous available zone is fully complete. The first level of a zone is a
 * fixed `standard` diagnostic; later levels' tiers follow the learner's recent
 * scores within that zone.
 */
export function useCampaignProgress(): CampaignProgress {
  const [completed, setCompleted] = useState<Set<string>>(() => new Set(loadCompleted()));
  const [stats, setStats] = useState<Record<string, LevelStats>>(() => loadStats());
  const [profile, setProfile] = useState<ProfileStats>(() => loadProfile());

  const markComplete = useCallback((levelId: string, levelStats?: LevelStats) => {
    setCompleted((prev) => {
      if (prev.has(levelId)) return prev;
      const next = new Set(prev);
      next.add(levelId);
      saveCompleted([...next]);
      return next;
    });
    if (levelStats) {
      setStats((prev) => {
        const next = { ...prev, [levelId]: levelStats };
        saveStats(next);
        return next;
      });
      setProfile((prev) => {
        const next = addCompletionToProfile(prev, levelStats);
        saveProfile(next);
        return next;
      });
    }
  }, []);

  const resetProgress = useCallback(() => {
    setCompleted(new Set());
    setStats({});
    setProfile(EMPTY_PROFILE);
    clearStoredProgress();
  }, []);

  return useMemo<CampaignProgress>(() => {
    const isLevelComplete = (levelId: string) => completed.has(levelId);

    const isZoneComplete = (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId);
      return !!zone && zone.levels.length > 0 && zone.levels.every((l) => completed.has(l.id));
    };

    const isZoneUnlocked = (zoneId: string) => {
      const idx = availableZones.findIndex((z) => z.id === zoneId);
      if (idx < 0) return false; // not an available zone
      if (idx === 0) return true; // tutorial is always open
      return availableZones[idx - 1].levels.every((l) => completed.has(l.id));
    };

    const isLevelUnlocked = (zone: Zone, index: number) => {
      if (!isZoneUnlocked(zone.id)) return false;
      if (index === 0) return true;
      return completed.has(zone.levels[index - 1].id);
    };

    const zoneClearedCount = (zoneId: string) => {
      const zone = zones.find((z) => z.id === zoneId);
      return zone ? zone.levels.filter((l) => completed.has(l.id)).length : 0;
    };

    // Rolling tier: the first level of a zone is a fixed standard diagnostic;
    // later levels read the scores of *this zone's* earlier levels.
    const tierForLevel = (zone: Zone, index: number): DifficultyTier => {
      if (index <= 0) return 'standard';
      const scores = zone.levels
        .slice(0, index)
        .map((l) => stats[l.id])
        .filter((s): s is LevelStats => !!s)
        .map((s) => scorePerformance(s));
      return selectTier(scores);
    };

    return {
      isLevelComplete,
      isLevelUnlocked,
      isZoneUnlocked,
      isZoneComplete,
      zoneClearedCount,
      markComplete,
      tierForLevel,
      getLevelStats: (levelId: string) => stats[levelId],
      getProfileStats: () => profile,
      resetProgress,
    };
  }, [completed, stats, profile, markComplete, resetProgress]);
}
