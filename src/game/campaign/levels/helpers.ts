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
