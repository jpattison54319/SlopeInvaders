/**
 * What a level completion earned, returned by the progress store's
 * `markComplete` so the victory overlay can announce it.
 */
import type { XpAward } from './xp';
import type { BadgeDef } from './badges';

export interface CompletionRewards {
  xp: XpAward;
  /** Badges first earned by this completion (already-owned ones never re-fire). */
  newBadges: BadgeDef[];
}
