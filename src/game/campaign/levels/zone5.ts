import type { Zone } from '../types';
import { fullGridLevel } from './helpers';

/**
 * Zone 5 — Shields & Walls. The full coordinate grid (all quadrants, ship at the
 * origin, slope + y-intercept + facing) now with WALLS that block shots crossing
 * them. A target can be hit by many equations, but a wall makes some of those
 * lines invalid, so students must choose a slope + intercept whose line actually
 * reaches the weak point without crossing a shield. Horizontal shots are blocked
 * by a vertical wall in their path, so they aren't always useful.
 *
 * Walls are vertical segments placed between the ship and an asteroid; a flat or
 * shallow line runs into the wall while a steeper / lower line slips past it.
 * Every asteroid keeps at least one clear line, so a level is still clearable
 * with no wasted shots (3 stars). A blocked shot destroys nothing → counts as a
 * miss → costs a star, which rewards reasoning the line out before firing.
 *
 * Scaffold mirrors prior zones: fixed diagnostic, guided practice, "many lines
 * but few valid", a boxed-in puzzle, then a no-preview mastery check. The wall
 * geometry is locked by zone5.test.ts (intended lines hit, tempting lines blocked).
 */
export const zoneFive: Zone = {
  id: 'zone-5',
  number: 5,
  name: 'Shields & Walls',
  theme: 'Constraints force better lines',
  status: 'available',
  levels: [
    {
      id: 'z5-l1',
      name: 'Shields Up',
      subtitle: 'A wall blocks the easy shot',
      config: fullGridLevel({
        id: 'z5-l1',
        name: 'Shields Up',
        learningGoal:
          'A shield blocks some shots. The line y = 0.5x runs straight into the wall — drop the line under it (try slope 1, y-intercept -3) so it reaches (6, 3).',
        asteroids: [{ id: 'a1', weakPoint: { x: 6, y: 3 }, points: 100 }],
        walls: [{ id: 'w1', from: { x: 3, y: 1 }, to: { x: 3, y: 3.2 } }],
        hearts: 5,
        callout:
          'If your aiming line crosses a wall, it gets stopped. Change the slope or y-intercept to route the line around the shield.',
      }),
    },
    {
      id: 'z5-l2',
      name: 'Pick the Angle',
      subtitle: 'Flat shots get blocked',
      adaptive: true,
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 4, y: 4 }, points: 100 },
            { id: 'a2', weakPoint: { x: 8, y: 2 }, points: 100 },
            { id: 'a3', weakPoint: { x: 6, y: 6 }, points: 100 },
          ],
        },
      },
      config: fullGridLevel({
        id: 'z5-l2',
        name: 'Pick the Angle',
        learningGoal:
          'Each shield blocks the flat shot at the asteroid’s height. Use a sloped line: y = x reaches (4, 4), and y = 0.5x - 2 reaches (8, 2).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 4 }, points: 100 },
          { id: 'a2', weakPoint: { x: 8, y: 2 }, points: 100 },
        ],
        // Vertical walls in front of each target at its own height block the flat line.
        walls: [
          { id: 'w1', from: { x: 2, y: 3.3 }, to: { x: 2, y: 4.7 } },
          { id: 'w2', from: { x: 4, y: 1.3 }, to: { x: 4, y: 2.7 } },
          { id: 'w3', from: { x: 3, y: 5.3 }, to: { x: 3, y: 6.7 } },
        ],
        hearts: 4,
        callout:
          'A flat (slope 0) line runs into the shield in front of the asteroid. Tilt the line so it slips past.',
      }),
    },
    {
      id: 'z5-l3',
      name: 'Many Lines, Few Valid',
      subtitle: 'Most equations are blocked',
      adaptive: true,
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 5, y: 5 }, points: 100 },
            { id: 'a2', weakPoint: { x: -4, y: 2 }, points: 100 },
            { id: 'a3', weakPoint: { x: 7, y: -3 }, points: 100 },
          ],
        },
      },
      config: fullGridLevel({
        id: 'z5-l3',
        name: 'Many Lines, Few Valid',
        learningGoal:
          'Lots of lines pass through (5, 5), but a slanted (45°) shield blocks the diagonal y = x — a steeper line (slope 2, y-intercept -5) gets past it. Face left for (-4, 2).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 5, y: 5 }, points: 100 },
          { id: 'a2', weakPoint: { x: -4, y: 2 }, points: 100 }, // Q2: face left
        ],
        walls: [
          // 45° (slope -1) shield across the y = x diagonal: blocks the obvious
          // diagonal shot, but a steeper or flatter line slips past its ends.
          { id: 'w1', from: { x: 2, y: 3 }, to: { x: 3, y: 2 } },
          { id: 'w2', from: { x: -2, y: 1.5 }, to: { x: -2, y: 2.5 } },
        ],
        hearts: 4,
        callout:
          'A slanted shield blocks the diagonal shot. The angled wall only stops lines that cross it — change the slope so your line goes over or under it.',
      }),
    },
    {
      id: 'z5-l4',
      name: 'Boxed In',
      subtitle: 'Only one or two lines work',
      adaptive: true,
      config: fullGridLevel({
        id: 'z5-l4',
        name: 'Boxed In',
        learningGoal:
          'Two shields bracket (4, 2): the flat line and the steep lines are both blocked. Only a gentle slope threads through — try slope 0.5, y-intercept 0.',
        asteroids: [{ id: 'a1', weakPoint: { x: 4, y: 2 }, points: 100 }],
        // One wall high in front, one low further out: only s≈0.5..1 lines pass.
        walls: [
          { id: 'w1', from: { x: 2, y: 1.5 }, to: { x: 2, y: 5 } },
          { id: 'w2', from: { x: 3, y: -3 }, to: { x: 3, y: 0.5 } },
        ],
        hearts: 4,
        callout:
          'The asteroid is boxed in. Work out which slope + y-intercept slips between both shields.',
      }),
    },
    {
      id: 'z5-l5',
      name: 'Zone 5 Mastery Check',
      subtitle: 'No preview — thread the shields',
      adaptive: true,
      config: fullGridLevel({
        id: 'z5-l5',
        name: 'Zone 5 Mastery Check',
        learningGoal:
          'No aiming line. Read each shield and pick a line that reaches the asteroid: (6, 3) past its vertical wall, (-4, 2) facing left, and (4, -4) around the slanted shield on its diagonal (try slope -2, y-intercept 4).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 6, y: 3 }, points: 100 }, // Q1: y = x - 3, right
          { id: 'a2', weakPoint: { x: -4, y: 2 }, points: 100 }, // Q2: face left
          { id: 'a3', weakPoint: { x: 4, y: -4 }, points: 100 }, // Q4: 45° shield blocks y=-x → use y=-2x+4
        ],
        walls: [
          { id: 'w1', from: { x: 3, y: 1 }, to: { x: 3, y: 3.2 } },
          { id: 'w2', from: { x: -2, y: 1.5 }, to: { x: -2, y: 2.5 } },
          // 45° (slope +1) shield across the y = -x diagonal to (4, -4).
          { id: 'w3', from: { x: 1.5, y: -2.5 }, to: { x: 2.5, y: -1.5 } },
        ],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  reflections: [
    {
      prompt: 'A wall blocks your shot to an asteroid. What should you change?',
      options: [
        'Adjust the slope and/or y-intercept so the line routes around it',
        'Nothing — walls can’t be avoided',
        'Fire faster',
      ],
      correctIndex: 0,
      explanation:
        'A wall only blocks the lines that cross it. Change the slope or y-intercept to pick a different line through the target that misses the shield.',
    },
    {
      prompt: 'True or False: each asteroid can be hit by only one possible equation.',
      options: ['True', 'False'],
      correctIndex: 1,
      explanation:
        'False. Infinitely many lines pass through any point, so many equations can hit a target. Walls just rule some of them out.',
    },
    {
      prompt: 'Why is a flat (slope 0) shot sometimes useless here?',
      options: [
        'A wall can block that height while a sloped line still reaches the target',
        'Horizontal lines don’t exist',
        'It always works',
      ],
      correctIndex: 0,
      explanation:
        'A shield in front of the asteroid blocks the flat line at its height, but a sloped line passes above or below the wall and still reaches the weak point.',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do you decide which line will get through the shields?',
      'When does a wall make the "obvious" equation invalid?',
      'How do slope and y-intercept work together to dodge an obstacle?',
    ],
  },
};
