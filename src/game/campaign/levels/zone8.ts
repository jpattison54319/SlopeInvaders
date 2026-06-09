import type { Zone } from '../types';
import { offsetGridLevel } from './helpers';

/**
 * Zone 8 — Moving Cannon (x-offset). The final zone: every prior mechanic (walls,
 * chains, friendly ships, all quadrants, slope + y-intercept + facing) PLUS the
 * cannon can now slide horizontally with the x-offset (Δx) control. The fired
 * line becomes y = m(x − h) + b, where h is the x the cannon sits at — it rides
 * the line at its own x, so the equation reads in point-slope form through the
 * launch point. (Sliding left makes h negative, which displays as y = m(x + |h|) + b.)
 *
 * Teaching core: repositioning changes where the beam starts and which targets
 * fall in the facing range. Its sharpest use is with a chain: a chain fixes the
 * line uniquely, so if a wall blocks that line from the origin, the ONLY fix is
 * to slide the cannon past the wall (you can't change the line). Anchoring the
 * cannon on the first rock turns the equation into clean point-slope form.
 *
 * Scaffold: a fixed diagnostic where sliding clears a wall, a range-extension
 * level, a chain that must be fired from a shifted position, a full-arsenal
 * capstone, then a no-preview final mastery check. Beating its mastery level (and
 * the end-of-zone reflection) completes the campaign.
 */
export const zoneEight: Zone = {
  id: 'zone-8',
  number: 8,
  name: 'Moving Cannon',
  theme: 'Slide the cannon: y = m(x − h) + b',
  status: 'available',
  levels: [
    {
      id: 'z8-l1',
      name: 'Slide the Cannon',
      subtitle: 'Move past the shield, then fire',
      config: offsetGridLevel({
        id: 'z8-l1',
        name: 'Slide the Cannon',
        learningGoal:
          'A shield right in front blocks the flat shot. Slide the cannon to Δx = 3 (past the wall), then a flat line y = 2 sails over to clear (6, 2) and (8, 2).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 6, y: 2 }, points: 100 },
          { id: 'a2', weakPoint: { x: 8, y: 2 }, points: 100 },
        ],
        // Shield just ahead of the origin blocks the flat shot at y = 2.
        walls: [{ id: 'w1', from: { x: 2, y: 1 }, to: { x: 2, y: 3 } }],
        hearts: 5,
        callout:
          'The new Δx control slides your cannon left or right. Move it past the shield, and the same simple line gets through.',
      }),
    },
    {
      id: 'z8-l2',
      name: 'Reposition',
      subtitle: 'Slide to bring targets into range',
      adaptive: true,
      config: offsetGridLevel({
        id: 'z8-l2',
        name: 'Reposition',
        learningGoal:
          'Both rocks are to your left, out of your forward sights. Slide to Δx = -4, then slope 2 fires y = 2(x + 4) through (-3, 2) and (-2, 4).',
        asteroids: [
          { id: 'a1', weakPoint: { x: -3, y: 2 }, points: 100 },
          { id: 'a2', weakPoint: { x: -2, y: 4 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'Facing right only reaches targets ahead of the cannon. Slide the cannon left until both rocks are in front of you, then aim.',
      }),
    },
    {
      id: 'z8-l3',
      name: 'Around the Shield',
      subtitle: 'A chain blocked from the origin',
      adaptive: true,
      config: offsetGridLevel({
        id: 'z8-l3',
        name: 'Around the Shield',
        learningGoal:
          'The chain (2, 1) & (6, 3) is the line y = 0.5x — but a shield blocks it from the origin. You can’t change the line, so slide to Δx = 2 and fire y = 0.5(x - 2) + 1.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain' },
        ],
        // Shield at x = 1 (y 0..1) crosses y = 0.5x (y = 0.5 there): the chain's
        // only line is blocked from the origin, so the cannon must move past it.
        walls: [{ id: 'w1', from: { x: 1, y: 0 }, to: { x: 1, y: 1 } }],
        hearts: 4,
        callout:
          'A chain’s line is fixed — you can’t steer around the shield by changing slope. Slide the cannon past the wall and fire the same line from there.',
      }),
    },
    {
      id: 'z8-l4',
      name: 'Full Arsenal',
      subtitle: 'Wall, chain, ally, and Δx',
      adaptive: true,
      config: offsetGridLevel({
        id: 'z8-l4',
        name: 'Full Arsenal',
        learningGoal:
          'Everything at once. Slide to Δx = 2 to fire the chain’s line y = 0.5(x - 2) + 1 past the shield. For the loner (5, 5), skip y = x (ally at (4, 4)) and use y = 2x - 5.',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 1 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: 5, y: 5 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 4, y: 4 } }],
        // Shield (y 0..0.8) blocks the chain's y = 0.5x (y = 0.5 at x = 1) from the
        // origin but stays clear of the loner's y = x — so the ally alone rules
        // out y = x, keeping the two lessons (slide vs dodge) cleanly separate.
        walls: [{ id: 'w1', from: { x: 1, y: 0 }, to: { x: 1, y: 0.8 } }],
        hearts: 4,
        callout:
          'Slide past the shield for the chain, then find a steeper line to the loner that leaves the ally untouched.',
      }),
    },
    {
      id: 'z8-l5',
      name: 'Final Mastery Check',
      subtitle: 'No preview — prove the whole course',
      adaptive: true,
      config: offsetGridLevel({
        id: 'z8-l5',
        name: 'Final Mastery Check',
        learningGoal:
          'No aiming line. Slide to Δx = 2 to fire the chain (2, 2) & (6, 4) as y = 0.5(x - 2) + 2 past the shield, mind the ally at (4, 4), and face left with slope 1 for (-3, 3).',
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 2 }, points: 100, linkGroup: 'chain' },
          { id: 'a2', weakPoint: { x: 6, y: 4 }, points: 100, linkGroup: 'chain' },
          { id: 'a3', weakPoint: { x: -3, y: 3 }, points: 100 },
        ],
        friendlies: [{ id: 'f1', position: { x: 4, y: 4 } }],
        // Shield at x = 1 (y 0..1.6) crosses y = 0.5x + 1 (y = 1.5 there).
        walls: [{ id: 'w1', from: { x: 1, y: 0 }, to: { x: 1, y: 1.6 } }],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  reflections: [
    {
      prompt: 'What does sliding the cannon (the x-offset, Δx) change?',
      options: [
        'Where the shot starts from and which targets are in front of you',
        'Only the colour of the beam',
        'The number of hearts you have',
      ],
      correctIndex: 0,
      explanation:
        'Δx moves the cannon along the x-axis. The line becomes y = m(x − h) + b through the new launch point, so the beam starts somewhere new and your forward range shifts with it.',
    },
    {
      prompt: 'A chain’s line is blocked by a wall from the origin. Why can’t you just change the slope?',
      options: [
        'A chain has exactly one line through both rocks — changing slope misses a rock',
        'Slope can never be changed',
        'Walls block every slope equally',
      ],
      correctIndex: 0,
      explanation:
        'Two points fix one line, so the chain’s slope and intercept are locked. The only way past the wall is to move the cannon and fire that same line from a clear position.',
    },
    {
      prompt: 'True or False: y = m(x − h) + b describes the same straight line as some y = mx + c.',
      options: ['True', 'False'],
      correctIndex: 0,
      explanation:
        'True. Expanding y = m(x − h) + b gives y = mx + (b − mh), so it is just point-slope form of an ordinary line — the x-offset is a handy way to anchor it at the cannon.',
    },
  ],
  debrief: {
    title: 'Final Debrief',
    prompts: [
      'When is moving the cannon better than changing the slope or intercept?',
      'How does a chain force you to reposition instead of re-aiming?',
      'Looking back over all eight zones, how do slope, intercept, facing, and offset each move a line?',
    ],
  },
};
