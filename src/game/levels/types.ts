/**
 * Level data model for Slope Invaders.
 *
 * The campaign model covers the shipped mechanics: walls/shields, linked
 * asteroid groups, friendly ships, all four quadrants, alternate equation forms,
 * and a movable ship.
 */
import type { Point } from '../logic/lineMath';
import type { Bounds } from '../logic/coordinateTransform';

/** Which part of the plane the level uses. */
export type QuadrantMode = 'quadrant-one' | 'quadrant-four' | 'all-quadrants';

/** The algebraic form the player is working in. */
export type EquationForm = 'y=mx' | 'y=mx+b' | 'point-slope';

/** Controls the player is allowed to manipulate this level. */
export type ControlKey = 'slope' | 'yIntercept' | 'xOffset' | 'direction';

/** Which way the ship faces / fires (the shot only travels this way). */
export type Facing = 'left' | 'right';

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
  /** Membership in a linked group: every member must be hit by one shot. */
  linkGroup?: string;
  // TODO: hp for armored asteroids, shieldGaps for special types.
}

/**
 * A wall/shield segment that blocks shots.
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
 * shot (the line passes through every member's weak point). Zone 6 instead tags
 * membership directly on each asteroid via `AsteroidSpec.linkGroup`, so this
 * explicit registry is currently unused (kept for forward compatibility).
 */
export interface LinkedGroupSpec {
  id: string;
  asteroidIds: string[];
}

/**
 * A friendly ship the player must NOT hit (Zone 7). If the fired line crosses a
 * friendly within tolerance (in the firing direction and not shielded by a
 * wall), the shot is scrubbed and a heart is lost. Friendlies are obstacles, not
 * targets — they live outside `asteroids` so they never count toward the win.
 */
export interface FriendlySpec {
  id: string;
  position: Point;
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
  defaults: { m: number; b: number; xOffset?: number; facing?: Facing };
  bounds: Bounds;
  /** The cannon/ship position (origin of the shot). */
  ship: { position: Point };
  asteroids: AsteroidSpec[];
  walls: WallSpec[];
  linkedGroups: LinkedGroupSpec[];
  /** Friendly ships the shot must avoid (Zone 7). Omit/empty for no friendlies. */
  friendlies?: FriendlySpec[];
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
  /**
   * Run the step-by-step spotlight tour the first time this level is opened
   * (persisted per level in localStorage). Used by the Tutorial.
   */
  guidedTour?: boolean;
}
