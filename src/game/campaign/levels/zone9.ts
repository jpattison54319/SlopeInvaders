import type { Zone } from '../types';
import { typedEquationLevel } from './helpers';

/**
 * Zone 9 — "Equation Forge" (The Capstone Zone).
 *
 * This is the final campaign zone. It tests whether students have internalised
 * the math concepts taught in Zones 1–8.
 *
 * Constraints:
 * - No steppers.
 * - No gameplay keyboard nudges.
 * - Trajectory preview line is locked to 'off' across all difficulty tiers.
 * - Fire is disabled until all visible slots are populated.
 * - Fractions (e.g. 3/4) and negative values can be typed.
 */
export const zoneNine: Zone = {
  id: 'zone-9',
  number: 9,
  name: 'Equation Forge',
  theme: 'Type the equation: y = m(x − h) + b',
  status: 'available',
  levels: [
    {
      id: 'z9-l1',
      name: 'Transmission Check',
      subtitle: 'Type values to aim',
      config: typedEquationLevel({
        id: 'z9-l1',
        name: 'Transmission Check',
        learningGoal:
          'Type values, fractions like 1/2 allowed, Enter to confirm, no aiming line in this zone.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 4 }, points: 100 },
          { id: 'a2', weakPoint: { x: 8, y: 6 }, points: 100 },
        ],
        defaults: { m: 1, b: 0 },
        hearts: 5,
        callout:
          'Welcome to the capstone. Stepper controls are offline. You must type in each slot (fractions like 1/2 are allowed). Enter commits a slot. Fire is disabled until all slots are filled.',
      }),
    },
    {
      id: 'z9-l2',
      name: 'No Cheap Shots',
      subtitle: 'Flat lines are blocked',
      adaptive: true,
      config: typedEquationLevel({
        id: 'z9-l2',
        name: 'No Cheap Shots',
        learningGoal:
          'Flat lines (m = 0) are blocked by shield walls. You must use sloped lines to reach the targets.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 4 }, points: 100 },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100 },
        ],
        // Shields block y = 4 and y = 3 from the origin.
        walls: [
          { id: 'w1', from: { x: 2, y: 3.8 }, to: { x: 2, y: 4.2 } },
          { id: 'w2', from: { x: 2, y: 2.8 }, to: { x: 2, y: 3.2 } },
        ],
        defaults: { m: 1, b: 0 },
        hearts: 4,
        callout:
          'Horizontal shield walls block flat lines. Aim with sloped lines that cross the shield boundaries.',
      }),
    },
    {
      id: 'z9-l3',
      name: 'Precision Quarters',
      subtitle: 'Fractions are required at distance',
      adaptive: true,
      config: typedEquationLevel({
        id: 'z9-l3',
        name: 'Precision Quarters',
        learningGoal:
          'At x = 8, minor slope errors cause large misses. Type m = -3/4 (or -0.75) to hit the target at (8, -6).',
        asteroids: [{ id: 'a1', weakPoint: { x: 8, y: -6 }, points: 100 }],
        // Block the integer slope line y = -1x + 2 at x = 4.
        walls: [{ id: 'w1', from: { x: 4, y: -2.5 }, to: { x: 4, y: -0.5 } }],
        defaults: { m: -1, b: 0 },
        hearts: 4,
        callout:
          'A simple integer slope like -1 is blocked by the wall. Dial in the precise slope of -3/4 to pass below it.',
      }),
      variants: {
        challenge: {
          // Add a second distant target that requires fractional slope
          asteroids: [
            { id: 'a1', weakPoint: { x: 8, y: -6 }, points: 100 },
            { id: 'a2', weakPoint: { x: -8, y: 6 }, points: 100 },
          ],
        },
      },
    },
    {
      id: 'z9-l4',
      name: 'Relocate and Solve',
      subtitle: 'Slide the cannon past the shield',
      adaptive: true,
      config: typedEquationLevel({
        id: 'z9-l4',
        name: 'Relocate and Solve',
        learningGoal:
          'A wall blocks any line from the origin. Slide to h = 4 and type y = 0.5(x - 4) + 1 to clear the chain.',
        equationForm: 'point-slope',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 8, y: 3 }, points: 100, linkGroup: 'chain' },
        ],
        // Blocks y = 0.5x - 1 (passes through x = 2, y = 0) from the origin.
        walls: [{ id: 'w1', from: { x: 2, y: -1 }, to: { x: 2, y: 1 } }],
        defaults: { m: 1, b: 0, xOffset: 0, facing: 'right' },
        hearts: 4,
        callout:
          'A wall blocks the chain from the origin. Slide the cannon to h = 4 to fire past it, and write the point-slope equation.',
      }),
    },
    {
      id: 'z9-l5',
      name: 'Forge Mastery',
      subtitle: 'The typed composition capstone',
      adaptive: true,
      config: typedEquationLevel({
        id: 'z9-l5',
        name: 'Forge Mastery',
        learningGoal:
          'Clear the linked chain (2, 2) & (6, 4) past the wall, avoiding the friendly at (4, 4), and hit the loner.',
        equationForm: 'point-slope',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 4 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: 5, y: -2 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 4, y: 4 } }],
        // Wall blocks the chain from the origin.
        walls: [{ id: 'w1', from: { x: 1, y: 0 }, to: { x: 1, y: 1.6 } }],
        defaults: { m: 1, b: 0, xOffset: 0, facing: 'right' },
        hearts: 3,
        callout:
          'Slide to Δx = 2 to clear the chain past the shield and under the friendly ship, then clear the remaining target.',
      }),
      variants: {
        challenge: {
          // Add a facing-left target to test direction controls under slots
          asteroids: [
            { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100, linkGroup: 'chain' },
            { id: 'a2', weakPoint: { x: 6, y: 4 }, points: 100, linkGroup: 'chain' },
            { id: 'a3', weakPoint: { x: 5, y: -2 }, points: 100 },
            { id: 'a4', weakPoint: { x: -4, y: 2 }, points: 100 },
          ],
        },
      },
    },
  ],
  reflections: [
    {
      prompt: 'When hitting a target at a large distance (like x = 8), why do fractions like 3/4 matter more than close integers?',
      options: [
        'Small slope errors multiply over distance, leading to large misses',
        'Fractions are faster to type',
        'The cannon can only fire fractions at distance',
      ],
      correctIndex: 0,
      explanation:
        'Small errors in slope (like using −0.7 instead of −0.75) compound over distance. At x = 8, an error of 0.05 results in a vertical miss of 0.4, which exceeds the hit tolerance.',
    },
    {
      prompt: 'In the point-slope form y = m(x − h) + b, what is the difference between changing b and changing h?',
      options: [
        'b shifts the line vertically, while h slides the cannon (horizontal anchor) left or right',
        'b slides the cannon, while h shifts the line vertically',
        'b changes the slope of the line, while h is the target coordinate',
      ],
      correctIndex: 0,
      explanation:
        'b represents the vertical offset (height) at the cannon’s position, while h is the horizontal position of the cannon itself. Adjusting h slides the anchor point horizontally.',
    },
    {
      prompt: 'True or False: Any line described by y = m(x − h) + b can be written in the form y = mx + c.',
      options: ['True', 'False'],
      correctIndex: 0,
      explanation:
        'True. Expanding y = m(x − h) + b gives y = mx + (b − mh), which matches the slope-intercept form where the y-intercept c = b − mh.',
    },
  ],
  debrief: {
    title: 'Final Debrief',
    prompts: [
      'How did writing equations directly differ from dialing them with steppers?',
      'When did a fractional slope (like 3/4 or 1/2) make a critical difference?',
      'Explain how you solved Level 4 by shifting the cannon’s horizontal anchor (h).',
    ],
  },
};
