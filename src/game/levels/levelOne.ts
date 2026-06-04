/**
 * Level 1 — "First Contact".
 *
 * Quadrant I only, cannon at the origin, slope and y-intercept enabled with the
 * intercept defaulting to 0. Three asteroids at clean integer coordinates that
 * are deliberately NOT collinear, so the student must change m (and sometimes b)
 * to line up each shot:
 *   • (2, 2) — the default line y = x already passes through this one.
 *   • (6, 3) — needs a gentler, fractional slope (e.g. y = 0.5x).
 *   • (3, 7) — needs a steeper line and/or a positive intercept (e.g. y = 2x + 1).
 */
import type { LevelConfig } from './types';

export const levelOne: LevelConfig = {
  id: 'level-1',
  name: 'First Contact',
  learningGoal:
    'Aim with y = mx + b. Change the slope (m) and y-intercept (b) so the line passes through each asteroid in Quadrant I.',
  quadrantMode: 'quadrant-one',
  equationForm: 'y=mx+b',
  allowedControls: ['slope', 'yIntercept'],
  defaults: { m: 1, b: 0 },
  bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10 },
  ship: { position: { x: 0, y: 0 } },
  asteroids: [
    { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100 },
    { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100 },
    { id: 'a3', weakPoint: { x: 3, y: 7 }, points: 100 },
  ],
  // No walls or linked groups yet — both are supported by the model for later levels.
  walls: [],
  linkedGroups: [],
  // Relaxed, exploration-friendly first level.
  maxShots: Infinity,
};
