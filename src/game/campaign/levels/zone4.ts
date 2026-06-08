import type { Zone } from '../types';
import { fullGridLevel } from './helpers';

/**
 * Zone 4 — Full Coordinate Grid. All four quadrants, ship at the origin, with
 * asteroids in every quadrant. Two ideas tie the course together:
 *
 *  - A line is infinite BOTH ways, but a shot fires ONE way. The preview is
 *    bright in the facing direction and faded the opposite way.
 *  - The ship is a cannon: the slope is its tilt (positive aims UP, negative aims
 *    DOWN) and the facing control picks the side (right/left). Facing left
 *    mirrors the aim across the ship, so a positive slope sends the shot
 *    up-and-LEFT (Quadrant II), a negative slope down-and-left (Quadrant III).
 *    Right keeps the usual y = m·x + b; left fires its mirror y = -m·x + b.
 *
 * With b = 0 the rule is simply: slope sign = up/down, facing = which side. The
 * y-intercept shifts the whole aim up or down.
 *
 * Every level has at least one asteroid per quadrant; later levels add more.
 * Scaffold mirrors prior zones: a fixed diagnostic, guided practice, mixed
 * practice, dimmed/sequential practice, then a no-preview mastery check.
 *
 * Adaptivity: `z4-l1` is the fixed standard diagnostic; the rest are `adaptive`.
 * `z4-l2` and `z4-l3` add an extra target at the challenge tier.
 */
export const zoneFour: Zone = {
  id: 'zone-4',
  number: 4,
  name: 'Four Quadrants',
  theme: 'The full coordinate grid',
  status: 'available',
  levels: [
    {
      id: 'z4-l1',
      name: 'All Four Quadrants',
      subtitle: 'Slope aims up/down, facing picks the side',
      config: fullGridLevel({
        id: 'z4-l1',
        name: 'All Four Quadrants',
        learningGoal:
          'A positive slope aims up, a negative slope aims down, and the facing buttons pick the side. With slope 1, hit (2, 2) facing right and (-3, 3) facing left; with slope -1, hit (2, -2) and (-3, -3).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100 }, // Q1: m=1, right
          { id: 'a2', weakPoint: { x: -3, y: 3 }, points: 100 }, // Q2: m=1, left
          { id: 'a3', weakPoint: { x: 2, y: -2 }, points: 100 }, // Q4: m=-1, right
          { id: 'a4', weakPoint: { x: -3, y: -3 }, points: 100 }, // Q3: m=-1, left
        ],
        hearts: 5,
        callout:
          'The bright line is where your shot goes; the faded line shows the equation continues behind you. Slope tilts the aim up (+) or down (-); the facing buttons send it left or right.',
      }),
    },
    {
      id: 'z4-l2',
      name: 'Off the Origin',
      subtitle: 'Shift the aim with b',
      adaptive: true,
      // Challenge adds a 5th target (a second Quadrant II hit on the m=1, b=2 aim).
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 1, y: 3 }, points: 100 }, // Q1: m=1, b=2, right
            { id: 'a2', weakPoint: { x: -1, y: 3 }, points: 100 }, // Q2: m=1, b=2, left
            { id: 'a3', weakPoint: { x: 3, y: -2 }, points: 100 }, // Q4: m=-1, b=1, right
            { id: 'a4', weakPoint: { x: -3, y: -2 }, points: 100 }, // Q3: m=-1, b=1, left
            { id: 'a5', weakPoint: { x: -2, y: 4 }, points: 100 }, // Q2: m=1, b=2, left
          ],
        },
      },
      config: fullGridLevel({
        id: 'z4-l2',
        name: 'Off the Origin',
        learningGoal:
          'The y-intercept b shifts the whole aim up or down. With slope 1 and b = 2, hit (1, 3) right and (-1, 3) left; with slope -1 and b = 1, hit (3, -2) right and (-3, -2) left.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 3 }, points: 100 }, // Q1: m=1, b=2, right
          { id: 'a2', weakPoint: { x: -1, y: 3 }, points: 100 }, // Q2: m=1, b=2, left
          { id: 'a3', weakPoint: { x: 3, y: -2 }, points: 100 }, // Q4: m=-1, b=1, right
          { id: 'a4', weakPoint: { x: -3, y: -2 }, points: 100 }, // Q3: m=-1, b=1, left
        ],
        hearts: 4,
        callout:
          'Set b to lift or drop the aim, choose your slope, then face the side your target is on.',
      }),
    },
    {
      id: 'z4-l3',
      name: 'Read the Quadrant',
      subtitle: 'Pick slope, intercept, and side',
      adaptive: true,
      // Challenge adds a 5th independent target.
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 4, y: 2 }, points: 100 }, // Q1: m=0.5, right
            { id: 'a2', weakPoint: { x: -2, y: 4 }, points: 100 }, // Q2: m=2, left
            { id: 'a3', weakPoint: { x: -4, y: -2 }, points: 100 }, // Q3: m=-0.5, left
            { id: 'a4', weakPoint: { x: 3, y: -3 }, points: 100 }, // Q4: m=-1, right
            { id: 'a5', weakPoint: { x: 2, y: 3 }, points: 100 }, // Q1: m=1.5, right
          ],
        },
      },
      config: fullGridLevel({
        id: 'z4-l3',
        name: 'Read the Quadrant',
        learningGoal:
          'Each asteroid needs its own slope, intercept, and facing. Its quadrant tells you the side (left or right) and whether the slope aims up or down.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 2 }, points: 100 }, // Q1: m=0.5, right
          { id: 'a2', weakPoint: { x: -2, y: 4 }, points: 100 }, // Q2: m=2, left
          { id: 'a3', weakPoint: { x: -4, y: -2 }, points: 100 }, // Q3: m=-0.5, left
          { id: 'a4', weakPoint: { x: 3, y: -3 }, points: 100 }, // Q4: m=-1, right
        ],
        hearts: 4,
        callout:
          'Right of the y-axis? Face right. Left of it? Face left. Up means a positive slope, down means a negative one.',
      }),
    },
    {
      id: 'z4-l4',
      name: 'Crossfire',
      subtitle: 'More targets, one at a time',
      adaptive: true,
      config: fullGridLevel({
        id: 'z4-l4',
        name: 'Crossfire',
        learningGoal:
          'Six asteroids spread across the grid, some sharing a quadrant. Clear the glowing one, then the next — set the slope, face the right side, and fire.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 4 }, points: 100 }, // Q1: m=2, right
          { id: 'a2', weakPoint: { x: 4, y: 2 }, points: 100 }, // Q1: m=0.5, right
          { id: 'a3', weakPoint: { x: 2, y: -4 }, points: 100 }, // Q4: m=-2, right
          { id: 'a4', weakPoint: { x: 4, y: -2 }, points: 100 }, // Q4: m=-0.5, right
          { id: 'a5', weakPoint: { x: -2, y: 4 }, points: 100 }, // Q2: m=2, left
          { id: 'a6', weakPoint: { x: -2, y: -4 }, points: 100 }, // Q3: m=-2, left
        ],
        hearts: 4,
        sequentialTargets: true,
        trajectoryStyle: 'dimmed',
        callout:
          'Only the glowing asteroid can be hit. Work out its slope, face its side, then fire.',
      }),
    },
    {
      id: 'z4-l5',
      name: 'Zone 4 Mastery Check',
      subtitle: 'No preview — prove it',
      adaptive: true,
      config: fullGridLevel({
        id: 'z4-l5',
        name: 'Zone 4 Mastery Check',
        learningGoal:
          'No aiming line. With slope 2, hit (1, 2) facing right and (-2, 4) facing left; with slope -0.5 and b = 1, hit (4, -1) right and (-4, -1) left.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 2 }, points: 100 }, // Q1: m=2, right
          { id: 'a2', weakPoint: { x: -2, y: 4 }, points: 100 }, // Q2: m=2, left
          { id: 'a3', weakPoint: { x: 4, y: -1 }, points: 100 }, // Q4: m=-0.5, b=1, right
          { id: 'a4', weakPoint: { x: -4, y: -1 }, points: 100 }, // Q3: m=-0.5, b=1, left
        ],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  // End-of-zone reflection (shown once, after the mastery check).
  reflections: [
    {
      prompt: 'True or False: y = mx + b is an infinite line that extends in both directions.',
      options: ['True', 'False'],
      correctIndex: 0,
      explanation:
        'True. The equation describes a full line through (0, b) with slope m that runs forever both ways — your ship only fires one direction, but the line itself never ends (that is why the preview fades behind you instead of stopping).',
    },
    {
      prompt: 'Your ship is facing right. Which asteroids can this shot reach?',
      options: ['Ones to the right of the ship', 'Ones to the left of the ship', 'Any asteroid on the line'],
      correctIndex: 0,
      explanation:
        'The shot travels only in the facing direction, so it reaches targets on that side. Flip to face left to hit the others.',
    },
    {
      prompt: 'Facing left with a positive slope, the shot heads…',
      options: ['Up and to the left (Quadrant II)', 'Down and to the left (Quadrant III)', 'Up and to the right (Quadrant I)'],
      correctIndex: 0,
      explanation:
        'A positive slope always tilts the aim up; facing left sends it up-and-left into Quadrant II. (A negative slope facing left would dive into Quadrant III.)',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do you decide which way to face your ship?',
      'How is the shot you fire different from the full equation line?',
      'How do slope and y-intercept work together to hit a point in any quadrant?',
    ],
  },
};
