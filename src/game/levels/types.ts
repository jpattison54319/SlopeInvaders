/**
 * Level data model for Slope Invaders.
 *
 * Only Level 1 is playable in this prototype, but the model is intentionally
 * future-ready: it can describe walls/shields, linked asteroid groups, all four
 * quadrants, alternate equation forms and a movable ship without code changes
 * to the type layer.
 */
import type { Point } from '../logic/lineMath';
import type { Bounds } from '../logic/coordinateTransform';

/** Which part of the plane the level uses. */
export type QuadrantMode = 'quadrant-one' | 'all-quadrants';

/** The algebraic form the player is working in. */
export type EquationForm = 'y=mx' | 'y=mx+b' | 'point-slope';

/** Controls the player is allowed to manipulate this level. */
export type ControlKey = 'slope' | 'yIntercept' | 'xOffset';

/** Visual/behavioural flavour of an asteroid (mostly future-facing). */
export type AsteroidType = 'standard' | 'armored' | 'special';

/** When the dashed aiming/trajectory preview is shown. */
export type TrajectoryMode = 'always' | 'after-fire' | 'off';

/** Visual weight of the trajectory preview. */
export type TrajectoryStyle = 'normal' | 'dimmed';

/**
 * An asteroid the player must hit. The `weakPoint` is the exact coordinate the
 * shot's line has to pass through.
 */
export interface AsteroidSpec {
  id: string;
  weakPoint: Point;
  /** Score awarded when destroyed. Defaults to 100 if omitted. */
  points?: number;
  type?: AsteroidType;
  /** Membership in a linked group (see LinkedGroupSpec). Future feature. */
  linkGroup?: string;
  // TODO: hp for armored asteroids, shieldGaps for special types.
}

/**
 * A wall/shield segment that blocks shots. Not yet enforced by gameplay — see
 * hitDetection.ts for where blocking will be checked.
 */
export interface WallSpec {
  id: string;
  from: Point;
  to: Point;
  /** Openings in the wall the shot can pass through. Future feature. */
  gaps?: Array<{ from: Point; to: Point }>;
}

/**
 * A group of asteroids that should be destroyable with a single well-aimed
 * shot (the line passes through every member's weak point). Future feature.
 */
export interface LinkedGroupSpec {
  id: string;
  asteroidIds: string[];
}

/** A complete level definition. */
export interface LevelConfig {
  id: string;
  name: string;
  /** Plain-language objective shown to the student. */
  learningGoal: string;
  quadrantMode: QuadrantMode;
  equationForm: EquationForm;
  allowedControls: ControlKey[];
  /** Starting equation values. */
  defaults: { m: number; b: number; xOffset?: number };
  bounds: Bounds;
  /** The cannon/ship position (origin of the shot). */
  ship: { position: Point };
  asteroids: AsteroidSpec[];
  walls: WallSpec[];
  linkedGroups: LinkedGroupSpec[];
  /** Use Infinity for relaxed, exploration-style levels. */
  maxShots: number;

  // --- Campaign-mode options (all optional; omitting reproduces legacy behavior) ---

  /**
   * Hearts the player starts with. Each miss costs one; losing all loses the
   * level. Omit (undefined) for no lose condition (legacy / sandbox levels).
   */
  hearts?: number;
  /** When the trajectory preview line is shown. Default 'always'. */
  trajectoryPreview?: TrajectoryMode;
  /** Visual weight of the preview line ('dimmed' = subtle). Default 'normal'. */
  trajectoryStyle?: TrajectoryStyle;
  /** Show axis tick numbers and per-asteroid coordinate labels. Default true. */
  showCoordinates?: boolean;
  /**
   * Only one asteroid is targetable at a time, advancing in array order as each
   * is destroyed. Non-active asteroids render but cannot be hit. Default false.
   */
  sequentialTargets?: boolean;
  /** A short teaching banner shown above the board for this level. */
  callout?: string;
}
