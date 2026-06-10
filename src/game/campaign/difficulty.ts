/**
 * Adaptive difficulty engine for Campaign mode (framework-free, unit-tested).
 *
 * Zone 1 personalizes itself per learner: the first level of a zone is a fixed
 * "standard" diagnostic; every later level is played at a tier derived from a
 * *rolling* read of the learner's recent performance. A learner who is doing
 * well gets the `challenge` tier (a scaffold falls off earlier, one fewer
 * heart); a learner who is struggling gets `support` (full scaffolds, +1 heart).
 *
 * We also capture a rich per-level stats record (`LevelStats`) — far more than
 * `scorePerformance` uses — for a future learner profile / statistics page. The
 * calculator is a free tool: `calculatorOpens` (and `tweaks`) are recorded but
 * never feed the score.
 */
import type { CampaignLevel } from './types';
import type { LevelConfig, TrajectoryMode, TrajectoryStyle } from '../levels/types';

export type DifficultyTier = 'support' | 'standard' | 'challenge';

/**
 * Everything we capture for one *visit* to a level (cumulative across retries,
 * since the Game's stat refs survive a reset). Only a few fields feed
 * `scorePerformance`; the rest exist for the future profile page.
 */
export interface LevelStats {
  levelId: string;
  /** Tier this visit was played at. */
  tier: DifficultyTier;
  /** Number of asteroids in the level. */
  targets: number;

  // --- shooting ---
  shots: number;
  hits: number;
  misses: number;
  /** Shots whose line never crossed the play area. */
  offBoardShots: number;
  /** Shots that destroyed more than one asteroid. */
  multiHits: number;
  accuracy: number;

  // --- survivability ---
  /** Hearts the level began with (may be Infinity for legacy levels). */
  startHearts: number;
  heartsLost: number;
  heartsRemaining: number;

  // --- attempts ---
  /** Whether the very first shot of the visit was a hit (drives an XP bonus). */
  firstShotHit?: boolean;
  /** Resolved trajectory-preview mode this visit was played with. */
  trajectoryPreview?: TrajectoryMode;
  /** Times the player ran out of hearts before finally winning. */
  losses: number;
  /** "Reset Level" / "Replay" presses (not counting post-loss retries). */
  manualResets: number;
  attempts: number;
  passedFirstTry: boolean;

  // --- engagement / tools (recorded, NOT scored) ---
  calculatorOpens: number;
  /** m / b / x-offset change events — a coarse engagement signal. */
  tweaks: number;

  // --- timing ---
  durationMs: number;
  timeToFirstShotMs: number | null;
  timeToFirstHitMs: number | null;
  /** Epoch ms when the level was first mounted this visit. */
  firstPlayedAt: number;
  /** Epoch ms when the level was won. */
  completedAt: number;

  // --- derived ---
  score: number;
}

/** The subset of stats that actually influences the performance score. */
export type ScorableStats = Pick<
  LevelStats,
  'targets' | 'shots' | 'startHearts' | 'heartsLost' | 'losses'
>;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/**
 * Performance score in [0, 1] (1 = flawless). Uses ONLY accuracy, hearts kept,
 * and whether they passed without dying. Calculator use and control tweaks are
 * deliberately excluded — the calculator is a free tool.
 */
export function scorePerformance(s: ScorableStats): number {
  const targets = Math.max(1, s.targets);
  // 1.0 when no shots were wasted; falls off as extra shots are taken.
  const accuracyNorm = targets / Math.max(s.shots, targets);
  const heartRatio =
    Number.isFinite(s.startHearts) && s.startHearts > 0
      ? clamp01(1 - s.heartsLost / s.startHearts)
      : 1;
  const firstTry = s.losses === 0 ? 1 : 0;
  return clamp01(0.6 * accuracyNorm + 0.3 * heartRatio + 0.1 * firstTry);
}

/**
 * Choose a tier from prior per-level scores (chronological, oldest first).
 * Uses an exponential moving average so the most recent levels weigh most,
 * with a wide dead-band to avoid flip-flopping.
 */
export function selectTier(scores: number[]): DifficultyTier {
  if (scores.length === 0) return 'standard';
  const alpha = 0.6;
  let ema = scores[0];
  for (let i = 1; i < scores.length; i++) {
    ema = alpha * scores[i] + (1 - alpha) * ema;
  }
  if (ema >= 0.75) return 'challenge';
  if (ema <= 0.45) return 'support';
  return 'standard';
}

/**
 * Scaffold "ladder" from most to least supportive. `challenge` steps one rung
 * harder than the level's authored (standard) rung; `support` forces rung 0.
 */
const SCAFFOLD_LADDER: ReadonlyArray<{ preview: TrajectoryMode; style: TrajectoryStyle }> = [
  { preview: 'always', style: 'normal' },
  { preview: 'always', style: 'dimmed' },
  { preview: 'after-fire', style: 'normal' },
  { preview: 'off', style: 'normal' },
];

function rungIndex(preview: TrajectoryMode, style: TrajectoryStyle): number {
  const i = SCAFFOLD_LADDER.findIndex((r) => r.preview === preview && r.style === style);
  if (i >= 0) return i;
  // Map any unrepresented combo to the nearest rung by preview/style.
  if (preview === 'off') return 3;
  if (preview === 'after-fire') return 2;
  if (style === 'dimmed') return 1;
  return 0;
}

const DEFAULT_HEARTS = 4;

/**
 * Resolve the playable `LevelConfig` for a campaign level at a given tier.
 * Non-adaptive levels and the `standard` tier return the authored config
 * unchanged. Per-tier `variants` (e.g. an extra asteroid) are merged last.
 */
export function configForTier(level: CampaignLevel, tier: DifficultyTier): LevelConfig {
  const base = level.config;
  if (!level.adaptive || tier === 'standard') return base;

  const baseHearts = base.hearts ?? DEFAULT_HEARTS;
  let derived: LevelConfig;

  if (tier === 'support') {
    derived = {
      ...base,
      hearts: baseHearts + 1,
      trajectoryPreview: 'always',
      trajectoryStyle: 'normal',
      showCoordinates: true,
    };
  } else {
    // challenge: one fewer heart and the next rung up the scaffold ladder.
    const idx = Math.min(
      SCAFFOLD_LADDER.length - 1,
      rungIndex(base.trajectoryPreview ?? 'always', base.trajectoryStyle ?? 'normal') + 1,
    );
    const rung = SCAFFOLD_LADDER[idx];
    derived = {
      ...base,
      hearts: Math.max(1, baseHearts - 1),
      trajectoryPreview: rung.preview,
      trajectoryStyle: rung.style,
    };
  }

  const variant = level.variants?.[tier];
  return variant ? { ...derived, ...variant } : derived;
}
