import type { Zone } from '../types';
import { slopeLevel } from './helpers';

/**
 * Tutorial zone — the single intro level. Teaches the grid, the cannon, firing
 * along the trajectory, the hearts/lives display, and the core idea that the
 * slope sets the laser's angle.
 *
 * The asteroid sits at (2, 4): the default slope m = 1 sends the laser through
 * (2, 2) — clearly below it — so the player MUST raise the slope to m = 2 to
 * connect. The lesson is felt, not just told.
 */
export const tutorialZone: Zone = {
  id: 'tutorial',
  number: 0,
  name: 'Tutorial',
  theme: 'Meet your cannon',
  status: 'available',
  levels: [
    {
      id: 'tut-1',
      name: 'Tutorial Shot',
      subtitle: 'Aim with slope',
      config: slopeLevel({
        id: 'tut-1',
        name: 'Tutorial Shot',
        learningGoal:
          'Your laser follows the dashed line. Raise the slope (m) until the line passes through the asteroid at (2, 4), then Fire.',
        asteroids: [{ id: 't1', weakPoint: { x: 2, y: 4 }, points: 100 }],
        hearts: 5,
        callout:
          'The dashed line shows your shot. Right now (m = 1) it falls short. Increase the slope to tilt the line up onto the asteroid, then Fire! Watch your hearts ♥ on the right — running out restarts the level.',
      }),
    },
  ],
};
