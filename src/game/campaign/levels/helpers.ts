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
