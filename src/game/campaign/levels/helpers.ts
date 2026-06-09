import type { LevelConfig } from '../../levels/types';

/**
 * Shared base for Tutorial + Zone 1 levels: Quadrant I, slope-only (y = mx with
 * b and x-offset locked), 0..10 grid, cannon at the origin, coordinates visible,
 * full trajectory preview. Override any field per level.
 */
export function slopeLevel(
  over: Partial<LevelConfig> &
    Pick<LevelConfig, 'id' | 'name' | 'learningGoal' | 'asteroids'>,
): LevelConfig {
  return {
    quadrantMode: 'quadrant-one',
    equationForm: 'y=mx',
    allowedControls: ['slope'],
    defaults: { m: 1, b: 0 },
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    ship: { position: { x: 0, y: 0 } },
    walls: [],
    linkedGroups: [],
    maxShots: Infinity,
    showCoordinates: true,
    trajectoryPreview: 'always',
    ...over,
  };
}

/**
 * Shared base for Zone 2 levels: same Quadrant I grid as {@link slopeLevel}, but
 * the y-intercept is unlocked (y = mx + b, slope + intercept controls). Slope
 * still defaults to 1 and b to 0, so a level only becomes solvable once the
 * student moves b away from the origin. Override any field per level.
 */
export function interceptLevel(
  over: Partial<LevelConfig> &
    Pick<LevelConfig, 'id' | 'name' | 'learningGoal' | 'asteroids'>,
): LevelConfig {
  return {
    quadrantMode: 'quadrant-one',
    equationForm: 'y=mx+b',
    allowedControls: ['slope', 'yIntercept'],
    defaults: { m: 1, b: 0 },
    bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
    ship: { position: { x: 0, y: 0 } },
    walls: [],
    linkedGroups: [],
    maxShots: Infinity,
    showCoordinates: true,
    trajectoryPreview: 'always',
    ...over,
  };
}

/**
 * Shared base for Zone 3 levels: Quadrant IV (ship at the top-left origin,
 * positive x to the right, negative y downward). Slope-only (y = mx with b
 * locked at 0, like Zone 1) so the lesson can't be bypassed with the intercept.
 * Slope starts at 0 — a flat line along the top edge the student tilts downward
 * into negative territory. A positive slope shoots up and off the top. Override
 * any field per level.
 */
export function negativeSlopeLevel(
  over: Partial<LevelConfig> &
    Pick<LevelConfig, 'id' | 'name' | 'learningGoal' | 'asteroids'>,
): LevelConfig {
  return {
    quadrantMode: 'quadrant-four',
    equationForm: 'y=mx',
    allowedControls: ['slope'],
    defaults: { m: 0, b: 0 },
    bounds: { minX: 0, maxX: 10, minY: -10, maxY: 0 },
    ship: { position: { x: 0, y: 0 } },
    walls: [],
    linkedGroups: [],
    maxShots: Infinity,
    showCoordinates: true,
    trajectoryPreview: 'always',
    ...over,
  };
}

/**
 * Shared base for Zone 4 levels: the full coordinate grid (all four quadrants),
 * ship at the origin. Slope + y-intercept + a facing-direction control: the
 * equation line is infinite both ways, but the shot fires only in the facing
 * direction (right reaches x ≥ 0, left reaches x ≤ 0). Default faces right.
 * Override any field per level.
 */
export function fullGridLevel(
  over: Partial<LevelConfig> &
    Pick<LevelConfig, 'id' | 'name' | 'learningGoal' | 'asteroids'>,
): LevelConfig {
  return {
    quadrantMode: 'all-quadrants',
    equationForm: 'y=mx+b',
    allowedControls: ['slope', 'yIntercept', 'direction'],
    defaults: { m: 1, b: 0, facing: 'right' },
    bounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },
    ship: { position: { x: 0, y: 0 } },
    walls: [],
    linkedGroups: [],
    maxShots: Infinity,
    showCoordinates: true,
    trajectoryPreview: 'always',
    ...over,
  };
}

/**
 * Shared base for Zone 8 levels: the full grid + facing of {@link fullGridLevel},
 * but the cannon can now slide horizontally with the x-offset control. The line
 * becomes y = m(x − h) + b, where h is the x the cannon sits at (it rides the
 * line at its own x). Repositioning opens new firing lanes around walls and
 * changes which targets fall in the facing range. Override any field per level.
 */
export function offsetGridLevel(
  over: Partial<LevelConfig> &
    Pick<LevelConfig, 'id' | 'name' | 'learningGoal' | 'asteroids'>,
): LevelConfig {
  return fullGridLevel({
    allowedControls: ['slope', 'yIntercept', 'xOffset', 'direction'],
    defaults: { m: 1, b: 0, xOffset: 0, facing: 'right' },
    ...over,
  });
}
