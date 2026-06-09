import type { Zone } from '../types';
import { fullGridLevel } from './helpers';

/**
 * Zone 7 — Friendly Ships. Everything from Zones 5–6 (walls, chains, all
 * quadrants, slope + y-intercept + facing) now shares the board with FRIENDLY
 * ships you must not hit. If the fired line crosses a friendly within tolerance
 * (in the firing direction, not shielded by a wall), the shot is SCRUBBED:
 * nothing is destroyed and a heart is lost (hitsFriendly in hitDetection.ts).
 *
 * Teaching core: the line is infinite and the laser carries downrange, so the
 * student is responsible for everything on the line in the firing direction —
 * not just the target. The puzzle is to pick a line that reaches the target /
 * threads the chain, routes around walls, AND stays clear of allies. A target
 * can be hit by infinitely many lines, so there is always a friendly-free one
 * (locked by zone7.test.ts); friendlies just rule the careless lines out.
 *
 * Scaffold: fixed diagnostic, crowded practice, a chain + ally, a full gauntlet
 * (wall + ally + chain), then a no-preview mastery check.
 */
export const zoneSeven: Zone = {
  id: 'zone-7',
  number: 7,
  name: 'Friendly Ships',
  theme: 'Mind your whole line of fire',
  status: 'available',
  levels: [
    {
      id: 'z7-l1',
      name: 'Hold Your Fire',
      subtitle: 'An ally sits on the easy line',
      config: fullGridLevel({
        id: 'z7-l1',
        name: 'Hold Your Fire',
        learningGoal:
          'A friendly ship sits at (4, 4) — right on the easy line y = x to your target (2, 2). Pick a different line through (2, 2) that misses the ally: try y = 2x - 2.',
        asteroids: [{ id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100 }],
        friendlies: [{ id: 'f1', position: { x: 4, y: 4 } }],
        hearts: 5,
        callout:
          'Your shot follows the whole line, not just the target. If the line crosses a green ally, the shot is scrubbed — choose another line through the target.',
      }),
    },
    {
      id: 'z7-l2',
      name: 'Crowded Space',
      subtitle: 'Allies shadow the lazy shots',
      adaptive: true,
      config: fullGridLevel({
        id: 'z7-l2',
        name: 'Crowded Space',
        learningGoal:
          'An ally guards each easy line. For (4, 4) skip y = x (ally at 2, 2) and use y = 2x - 4. For (6, 3) skip y = 0.5x (ally at 4, 2) and use y = x - 3.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 4 }, points: 100 },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100 },
        ],
        friendlies: [
          { id: 'f1', position: { x: 2, y: 2 } },
          { id: 'f2', position: { x: 4, y: 2 } },
        ],
        hearts: 4,
        callout:
          'The obvious line to each rock runs through an ally. Find a steeper or shifted line that reaches the target and leaves every green ship alone.',
      }),
    },
    {
      id: 'z7-l3',
      name: 'Escort',
      subtitle: 'A chain with an ally nearby',
      adaptive: true,
      config: fullGridLevel({
        id: 'z7-l3',
        name: 'Escort',
        learningGoal:
          'The chain (2, 1) & (6, 3) is y = 0.5x and stays clear of the ally. The loner (4, 4) cannot use y = x (ally at 2, 2) — go steeper with y = 2x - 4.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: 4, y: 4 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 2, y: 2 } }],
        hearts: 4,
        callout:
          'The chain’s one line happens to miss the ally — fire it. For the loner, the easy line hits the ally, so reroute steeper.',
      }),
    },
    {
      id: 'z7-l4',
      name: 'Gauntlet',
      subtitle: 'Wall, ally, and a chain',
      adaptive: true,
      config: fullGridLevel({
        id: 'z7-l4',
        name: 'Gauntlet',
        learningGoal:
          'Thread it all: the chain (2, 1) & (6, 3) is y = 0.5x (under the shield, clear of the ally at (3, 3)). For the left rock (-3, 3), face left with slope 1 (y = -x).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: -3, y: 3 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 3, y: 3 } }],
        // Shield at x = 4 (y 2.5..6): the chain line y = 0.5x passes under it (y = 2),
        // but a too-steep guess like y = x (y = 4) is blocked.
        walls: [{ id: 'w1', from: { x: 4, y: 2.5 }, to: { x: 4, y: 6 } }],
        hearts: 4,
        callout:
          'One line must clear the shield, dodge the ally, AND pass through both chained rocks. Find it before you fire.',
      }),
    },
    {
      id: 'z7-l5',
      name: 'Zone 7 Mastery Check',
      subtitle: 'No preview — protect the allies',
      adaptive: true,
      config: fullGridLevel({
        id: 'z7-l5',
        name: 'Zone 7 Mastery Check',
        learningGoal:
          'No aiming line. The chain (1, 2) & (3, 6) is y = 2x. The loner (6, 2) cannot use y = x/3 (ally at (3, 1)) — use y = 0.5x - 1 instead.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 2 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 3, y: 6 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: 6, y: 2 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 3, y: 1 } }],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  reflections: [
    {
      prompt: 'Your line passes through the target — but also through a friendly ship. What happens?',
      options: [
        'The shot is scrubbed: nothing is destroyed and you lose a heart',
        'Only the friendly is destroyed',
        'The target breaks and the ally is fine',
      ],
      correctIndex: 0,
      explanation:
        'The laser follows the whole line in your firing direction. Crossing an ally scrubs the shot, so you must choose a line that reaches the target and stays clear of every friendly.',
    },
    {
      prompt: 'True or False: if an ally blocks the easy line, the target simply cannot be hit.',
      options: ['True', 'False'],
      correctIndex: 1,
      explanation:
        'False. Infinitely many lines pass through any point, so a friendly-free line always exists — go steeper, flatter, or shift the intercept.',
    },
    {
      prompt: 'A wall stands between your cannon and a friendly ship on your line. Is the friendly in danger?',
      options: [
        'No — the wall stops the shot before it reaches the ally',
        'Yes — friendlies are always hit',
        'Only if the slope is positive',
      ],
      correctIndex: 0,
      explanation:
        'A wall in front of a friendly shields it: the beam is blocked first, so it never reaches the ally (though the shot is still blocked from the target).',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'Why does the whole line matter, not just the target?',
      'When an ally blocks the easy line, how do you find a safe one?',
      'How do walls, chains, and allies combine to pin down a single good line?',
    ],
  },
};
