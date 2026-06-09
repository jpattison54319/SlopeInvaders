import type { Zone } from '../types';
import { fullGridLevel } from './helpers';

/**
 * Zone 6 — Linked Asteroids. Keeps the Zone 4/5 controls (all quadrants, slope +
 * y-intercept + facing) and introduces CHAINS: asteroids tagged with the same
 * `linkGroup` are bound together, so one shot must pass through EVERY member at
 * once or none of them are destroyed (resolveDestroyed in hitDetection.ts). A
 * half-clipped chain destroys nothing → counts as a miss ("Chained!").
 *
 * Teaching core: a linked pair is two points, and two points determine exactly
 * one line. To clear the pair the student finds the equation through both weak
 * points — slope = rise/run between them, then solve for the intercept. This is
 * the strongest "two points → one line" lesson in the course (callback to Zone 2).
 *
 * Author rule: every linked group must be COLLINEAR (locked by zone6.test.ts),
 * and each chain's line must be clear (on board, in range, not wall-blocked) so
 * 3 stars stays achievable. Scaffold mirrors prior zones: fixed diagnostic,
 * guided practice, mixed practice, walls, then a no-preview mastery check.
 */
export const zoneSix: Zone = {
  id: 'zone-6',
  number: 6,
  name: 'Linked Asteroids',
  theme: 'Two points determine one line',
  status: 'available',
  levels: [
    {
      id: 'z6-l1',
      name: 'Linked Up',
      subtitle: 'One line through both',
      config: fullGridLevel({
        id: 'z6-l1',
        name: 'Linked Up',
        learningGoal:
          'These two rocks are chained — one shot must pass through BOTH or neither breaks. Find the line through (2, 1) and (6, 3): slope = rise/run = 2/4 = 0.5, so y = 0.5x.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain-1' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain-1' },
        ],
        hearts: 5,
        callout:
          'Chained rocks break only when ONE line crosses every link at once. Two points fix exactly one line — work out its slope and intercept.',
        guidedTour: false,
      }),
    },
    {
      id: 'z6-l2',
      name: 'Chain Gang',
      subtitle: 'A chain on each side',
      adaptive: true,
      config: fullGridLevel({
        id: 'z6-l2',
        name: 'Chain Gang',
        learningGoal:
          'Two chains. The right pair (1, 1) & (4, 4) is the line y = x. The left pair (-1, 1) & (-4, 4) is y = -x — dial slope 1 and face LEFT to fire its mirror.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 1 }, points: 100, linkGroup: 'right' },
          { id: 'a2', weakPoint: { x: 4, y: 4 }, points: 100, linkGroup: 'right' },
          { id: 'a3', weakPoint: { x: -1, y: 1 }, points: 100, linkGroup: 'left' },
          { id: 'a4', weakPoint: { x: -4, y: 4 }, points: 100, linkGroup: 'left' },
        ],
        hearts: 4,
        callout:
          'One chain is to your right, one to your left. Find each chain’s line, then face the side it sits on before you fire.',
      }),
    },
    {
      id: 'z6-l3',
      name: 'Mixed Cargo',
      subtitle: 'Chains and loners together',
      adaptive: true,
      config: fullGridLevel({
        id: 'z6-l3',
        name: 'Mixed Cargo',
        learningGoal:
          'Some rocks are chained, some fly solo. Chain A (2, 2) & (5, 5) is y = x; chain B (4, 3) & (8, 1) is y = -0.5x + 5; the loner (3, 6) is y = 2x.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100, linkGroup: 'a' },
          { id: 'a2', weakPoint: { x: 5, y: 5 }, points: 100, linkGroup: 'a' },
          { id: 'a3', weakPoint: { x: 4, y: 3 }, points: 100, linkGroup: 'b' },
          { id: 'a4', weakPoint: { x: 8, y: 1 }, points: 100, linkGroup: 'b' },
          { id: 'a5', weakPoint: { x: 3, y: 6 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'A loner needs only one line through itself; a chain needs the single line through all its links. Read each one before firing.',
      }),
    },
    {
      id: 'z6-l4',
      name: 'Chained & Walled',
      subtitle: 'A shield guards a loner',
      adaptive: true,
      config: fullGridLevel({
        id: 'z6-l4',
        name: 'Chained & Walled',
        learningGoal:
          'The chain (2, 1) & (6, 3) is y = 0.5x and runs clear. The loner (4, 4) hides behind a shield — the obvious y = x is blocked, so go over it (try y = 0.5x + 2).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: 4, y: 4 }, points: 100 },
        ],
        // Vertical shield at x = 2 (y 1.3..2.7): blocks the lazy y = x to (4,4),
        // but clears the chain line y = 0.5x (y = 1 there) and y = 0.5x + 2 (y = 3).
        walls: [{ id: 'w1', from: { x: 2, y: 1.3 }, to: { x: 2, y: 2.7 } }],
        hearts: 4,
        callout:
          'A chain still needs its one line — and a shield can rule out the easy line to a loner. Reroute around the wall while keeping the chain’s line clear.',
      }),
    },
    {
      id: 'z6-l5',
      name: 'Zone 6 Mastery Check',
      subtitle: 'No preview — read every chain',
      adaptive: true,
      config: fullGridLevel({
        id: 'z6-l5',
        name: 'Zone 6 Mastery Check',
        learningGoal:
          'No aiming line. Right chain (2, 1) & (6, 3) is y = 0.5x (a shield rules out steeper guesses). Left chain (-2, 2) & (-4, 4) is y = -x — slope 1, face left.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'right' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'right' },
          { id: 'a3', weakPoint: { x: -2, y: 2 }, points: 100, linkGroup: 'left' },
          { id: 'a4', weakPoint: { x: -4, y: 4 }, points: 100, linkGroup: 'left' },
        ],
        // Vertical shield at x = 4 (y 2.5..6): clears y = 0.5x (y = 2) but blocks a
        // too-steep guess like y = x (y = 4) to the right chain.
        walls: [{ id: 'w1', from: { x: 4, y: 2.5 }, to: { x: 4, y: 6 } }],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  reflections: [
    {
      prompt: 'Two asteroids are chained together. What clears both in one shot?',
      options: [
        'The single line that passes through both weak points',
        'Any line that touches one of them',
        'A horizontal line at either rock’s height',
      ],
      correctIndex: 0,
      explanation:
        'Two points determine exactly one line. Only the equation through both weak points hits the whole chain — clip just one and nothing breaks.',
    },
    {
      prompt: 'True or False: a chained pair can be cleared by hitting one rock now and the other later.',
      options: ['True', 'False'],
      correctIndex: 1,
      explanation:
        'False. A chain is all-or-none in a SINGLE shot. Hitting one link without the other destroys nothing and costs you a heart.',
    },
    {
      prompt: 'You know a chain’s two points. How do you find its line?',
      options: [
        'Slope = rise/run between them, then solve for the y-intercept',
        'Guess slopes until one works',
        'Use the y-intercept only',
      ],
      correctIndex: 0,
      explanation:
        'Compute the slope from the two points, then plug one point into y = mx + b to solve for b. That equation is the chain’s only line.',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do two points give you exactly one line?',
      'Why does clipping only one link of a chain destroy nothing?',
      'How did you find the slope and intercept of a chain from its two rocks?',
    ],
  },
};
