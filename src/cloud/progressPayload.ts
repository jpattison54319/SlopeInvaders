/**
 * Pure builder that turns a learner's local progress snapshot into the cloud
 * sync payload (`{ summary, levels }`). It reuses the existing campaign data
 * shapes — there is no parallel persistence model — so the teacher dashboard
 * sees exactly the stats the Pilot Profile shows.
 */
import {
  scorePerformance,
  selectTier,
  type DifficultyTier,
  type LevelStats,
} from '../game/campaign/difficulty';
import { describeTierDecision } from '../game/campaign/adaptivityTrace';
import { zones } from '../game/campaign/zones';
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

/**
 * Adaptivity transparency for the *teacher* dashboard only (docs/agent/02):
 * which difficulty tier this level resolves to given the student's current
 * same-zone performance, and a plain-language reason. This rides inside the
 * synced `stats` jsonb; the student-facing UI never renders it (adaptivity
 * stays invisible and non-stigmatizing for learners).
 */
export interface LevelAdaptivityInfo {
  tier: DifficultyTier;
  /** EMA of prior same-zone scores; omitted when no history (diagnostic). */
  ema?: number;
  sampleCount: number;
  reason: string;
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
  stats: LevelStats & { adaptivity?: LevelAdaptivityInfo };
}

export interface ProgressPayload {
  summary: ProgressSummary;
  levels: LevelResultPayload[];
}

function starsFor(levelId: string, snap: ProgressSnapshot): StarCount {
  return snap.levelStars[levelId] ?? starsForLevel(true, snap.levelStats[levelId]);
}

/**
 * Reconstruct the tier decision for a level from the snapshot, mirroring
 * `useCampaignProgress.tierForLevel`: the first level of a zone is the fixed
 * standard diagnostic; later levels roll an EMA over prior same-zone scores.
 * Returns undefined for level ids outside the zone registry.
 */
function adaptivityFor(levelId: string, snap: ProgressSnapshot): LevelAdaptivityInfo | undefined {
  for (const zone of zones) {
    const index = zone.levels.findIndex((l) => l.id === levelId);
    if (index < 0) continue;
    const scores =
      index <= 0
        ? []
        : zone.levels
            .slice(0, index)
            .map((l) => snap.levelStats[l.id])
            .filter((s): s is LevelStats => !!s)
            .map((s) => scorePerformance(s));
    const decision = selectTier(scores);
    return {
      tier: decision.tier,
      ...(Number.isFinite(decision.ema) ? { ema: decision.ema } : {}),
      sampleCount: decision.sampleCount,
      reason: describeTierDecision(decision),
    };
  }
  return undefined;
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
      const adaptivity = adaptivityFor(levelId, snap);
      return {
        levelId,
        stars: starsFor(levelId, snap),
        score: stats.score,
        accuracy: stats.accuracy,
        attempts: stats.attempts,
        passedFirstTry: stats.passedFirstTry,
        completedAt: stats.completedAt,
        stats: adaptivity ? { ...stats, adaptivity } : stats,
      } satisfies LevelResultPayload;
    })
    .filter((r): r is LevelResultPayload => r !== null);

  return { summary, levels };
}
