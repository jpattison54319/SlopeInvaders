/**
 * Campaign data model: zones of levels with teaching extras.
 *
 * A `CampaignLevel` *contains* a `LevelConfig` (composition) so the gameplay
 * engine stays generic and reusable by future modes (Arcade/Versus). Reflection
 * and debrief content live here — not on `LevelConfig` — so the legacy level
 * registry and its tests stay untouched.
 */
import type { LevelConfig } from '../levels/types';
import type { DifficultyTier } from './difficulty';

/** A multiple-choice reflection shown after a level is completed. */
export interface ReflectionQuestion {
  prompt: string;
  options: string[];
  /** Index into `options` of the correct answer. */
  correctIndex: number;
  /** Shown after the student answers. */
  explanation?: string;
}

/** Open-ended end-of-zone reflection (not graded). */
export interface ZoneDebrief {
  title: string;
  prompts: string[];
}

export interface CampaignLevel {
  /** Globally-unique id, e.g. "z1-l3". */
  id: string;
  name: string;
  /** Short skill tag for the level-select card. */
  subtitle: string;
  /** The playable level definition (this is the *standard*-tier config). */
  config: LevelConfig;
  /**
   * When true, this level's difficulty adapts to the learner's recent
   * performance (see difficulty.ts). The first level of a zone is left
   * non-adaptive so it can serve as a fixed diagnostic. Default false.
   */
  adaptive?: boolean;
  /**
   * Optional per-tier overrides merged over the rule-derived config (e.g. an
   * extra asteroid at `challenge`). Most adaptive levels need none — the
   * hearts/scaffold deltas are derived automatically.
   */
  variants?: Partial<Record<DifficultyTier, Partial<LevelConfig>>>;
}

export type ZoneStatus = 'available' | 'coming-soon';

export interface Zone {
  /** Stable id, e.g. "tutorial", "zone-1". */
  id: string;
  /** Display number (0 for the tutorial zone). */
  number: number;
  name: string;
  /** One-line theme, e.g. "Slope as rise/run". */
  theme: string;
  status: ZoneStatus;
  levels: CampaignLevel[];
  /**
   * End-of-zone reflection, shown after the final (mastery) level — multiple
   * choice questions followed by open-ended debrief prompts. Not per-level.
   */
  reflections?: ReflectionQuestion[];
  debrief?: ZoneDebrief;
}
