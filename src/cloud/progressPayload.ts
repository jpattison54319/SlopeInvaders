/**
 * Pure builder that turns a learner's local progress snapshot into the cloud
 * sync payload (`{ summary, levels }`). It reuses the existing campaign data
 * shapes — there is no parallel persistence model — so the teacher dashboard
 * sees exactly the stats the Pilot Profile shows.
 */
import type { LevelStats } from '../game/campaign/difficulty';
import type { ProfileStats } from '../game/campaign/profileStats';
import { starsForLevel, type StarCount } from '../game/campaign/stars';
import { rankForXp } from '../game/campaign/xp';

/** The local state needed to build a sync payload (a subset of the progress hook). */
export interface ProgressSnapshot {
  profile: ProfileStats;
  totalXp: number;
  levelStats: Record<string, LevelStats>;
  levelStars: Record<string, StarCount>;
  completedLevelIds: string[];
}

/** Denormalized per-student row for fast dashboard listing. */
export interface ProgressSummary {
  levelsCompleted: number;
  totalStars: number;
  totalXp: number;
  rank: string;
  totalShots: number;
  totalHits: number;
  totalMisses: number;
  totalHeartsLost: number;
  totalPlaytimeMs: number;
  lastPlayedAt: number | null;
}

/** One per-level result for drill-down on the dashboard. */
export interface LevelResultPayload {
  levelId: string;
  stars: StarCount;
  score: number;
  accuracy: number;
  attempts: number;
  passedFirstTry: boolean;
  completedAt: number;
  stats: LevelStats;
}

export interface ProgressPayload {
  summary: ProgressSummary;
  levels: LevelResultPayload[];
}

function starsFor(levelId: string, snap: ProgressSnapshot): StarCount {
  return snap.levelStars[levelId] ?? starsForLevel(true, snap.levelStats[levelId]);
}

export function buildProgressPayload(snap: ProgressSnapshot): ProgressPayload {
  const completed = snap.completedLevelIds;

  const totalStars = completed.reduce((sum, id) => sum + starsFor(id, snap), 0);

  const summary: ProgressSummary = {
    levelsCompleted: snap.profile.levelsCompleted,
    totalStars,
    totalXp: snap.totalXp,
    rank: rankForXp(snap.totalXp).name,
    totalShots: snap.profile.totalShots,
    totalHits: snap.profile.totalHits,
    totalMisses: snap.profile.totalMisses,
    totalHeartsLost: snap.profile.totalHeartsLost,
    totalPlaytimeMs: snap.profile.totalPlaytimeMs,
    lastPlayedAt: snap.profile.lastPlayedAt,
  };

  const levels: LevelResultPayload[] = completed
    .map((levelId) => {
      const stats = snap.levelStats[levelId];
      if (!stats) return null; // legacy completion without rich stats — skip detail
      return {
        levelId,
        stars: starsFor(levelId, snap),
        score: stats.score,
        accuracy: stats.accuracy,
        attempts: stats.attempts,
        passedFirstTry: stats.passedFirstTry,
        completedAt: stats.completedAt,
        stats,
      } satisfies LevelResultPayload;
    })
    .filter((r): r is LevelResultPayload => r !== null);

  return { summary, levels };
}
