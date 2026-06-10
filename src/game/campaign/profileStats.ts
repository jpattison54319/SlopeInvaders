/** Lifetime, cross-level totals — derived from the per-level stats, persisted
 * for the learner profile / statistics page. */
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
