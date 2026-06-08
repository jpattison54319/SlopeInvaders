import type { Zone } from '../types';
import { negativeSlopeLevel } from './helpers';

/**
 * Zone 3 — Negative Slopes. Quadrant IV: the ship sits at the top-left origin,
 * positive x runs right, negative y runs down. Slope-only (y = mx, b locked at
 * 0) so students can't dodge the lesson with the intercept — the only way to
 * reach an asteroid (positive x, negative y) is a NEGATIVE slope, a line that
 * falls as it moves right. A positive slope climbs up and off the top edge; the
 * default m = 0 is a flat line along the top that the student tilts downward.
 *
 * Scaffold mirrors Zone 2: a fixed diagnostic, guided practice, a fractional
 * beat, harder dimmed/sequential practice, then a no-preview mastery check.
 * Reflection + debrief happen once, at the end.
 *
 * Design note: a single target can still be reached by many lines, but every
 * required line here is a falling (negative-slope) line. The mastery check uses
 * pairs of targets on one slanted line so the flat (m = 0) line — which can't
 * pass through two different heights — cannot clear them.
 *
 * Adaptivity: `z3-l1` is the fixed standard diagnostic; the rest are `adaptive`,
 * so hearts/scaffolds shift with the learner's recent Zone-3 performance (see
 * ../difficulty.ts). `z3-l2` and `z3-l3` add an extra target at the challenge
 * tier; the others rely on the rule transform.
 */
export const zoneThree: Zone = {
  id: 'zone-3',
  number: 3,
  name: 'Negative Slopes',
  theme: 'Lines that fall',
  status: 'available',
  levels: [
    {
      id: 'z3-l1',
      name: 'Lines That Fall',
      subtitle: 'Tilt the line downward',
      config: negativeSlopeLevel({
        id: 'z3-l1',
        name: 'Lines That Fall',
        learningGoal:
          'These asteroids are below and to the right. A positive slope shoots up off the top — lower the slope below zero so the line falls onto (1, -2) and (4, -8).',
        // Both lie on y = -2x. Tilt the flat default (m = 0) down to m = -2.
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: -2 }, points: 100 },
          { id: 'a2', weakPoint: { x: 4, y: -8 }, points: 100 },
        ],
        hearts: 5,
        callout:
          'A negative slope falls as you move right. From (0, 0) the line drops 2 down for every 1 across — that is a slope of -2.',
      }),
    },
    {
      id: 'z3-l2',
      name: 'Steeper Descents',
      subtitle: 'Bigger slope, faster fall',
      adaptive: true,
      // Challenge adds a third descent at yet another negative slope.
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 1, y: -3 }, points: 100 }, // m = -3
            { id: 'a2', weakPoint: { x: 4, y: -2 }, points: 100 }, // m = -0.5
            { id: 'a3', weakPoint: { x: 2, y: -3 }, points: 100 }, // m = -1.5
          ],
        },
      },
      config: negativeSlopeLevel({
        id: 'z3-l2',
        name: 'Steeper Descents',
        learningGoal:
          'The bigger the negative slope, the steeper the fall. Hit the steep (1, -3) and the gentle (4, -2) — each needs a different negative slope.',
        // (1,-3) needs m = -3; (4,-2) needs the gentler m = -0.5.
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: -3 }, points: 100 },
          { id: 'a2', weakPoint: { x: 4, y: -2 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'Slope -3 drops fast; slope -1/2 drops slowly. Read each target: how far down over how far across?',
      }),
    },
    {
      id: 'z3-l3',
      name: 'Half Steps Down',
      subtitle: 'Fractional negative slopes',
      adaptive: true,
      // Challenge adds a steeper fractional descent needing a third shot.
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 4, y: -2 }, points: 100 }, // m = -0.5
            { id: 'a2', weakPoint: { x: 2, y: -3 }, points: 100 }, // m = -1.5
            { id: 'a3', weakPoint: { x: 2, y: -5 }, points: 100 }, // m = -2.5
          ],
        },
      },
      config: negativeSlopeLevel({
        id: 'z3-l3',
        name: 'Half Steps Down',
        learningGoal:
          'Negative slopes can be fractions too. Use half-steps to hit (4, -2) and (2, -3) — lower the slope by 0.5 at a time.',
        // (4,-2) on y = -0.5x; (2,-3) on y = -1.5x.
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: -2 }, points: 100 },
          { id: 'a2', weakPoint: { x: 2, y: -3 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'From (0,0) to (4,-2) the line falls 2 over a run of 4 — what fraction is that? Negative, of course.',
      }),
    },
    {
      id: 'z3-l4',
      name: 'Mixed Descents',
      subtitle: 'One target at a time',
      adaptive: true,
      config: negativeSlopeLevel({
        id: 'z3-l4',
        name: 'Mixed Descents',
        learningGoal:
          'Take out the glowing asteroid, then the next. Each needs a different negative slope — read its coordinates and aim downward.',
        // Sequential; four distinct negative slopes.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: -4 }, points: 100 }, // m = -2
          { id: 'a2', weakPoint: { x: 4, y: -2 }, points: 100 }, // m = -0.5
          { id: 'a3', weakPoint: { x: 3, y: -3 }, points: 100 }, // m = -1
          { id: 'a4', weakPoint: { x: 1, y: -3 }, points: 100 }, // m = -3
        ],
        hearts: 4,
        sequentialTargets: true,
        trajectoryStyle: 'dimmed',
        callout:
          'Only the glowing asteroid can be hit. Work out each slope from its coordinates — down over across is negative.',
      }),
    },
    {
      id: 'z3-l5',
      name: 'Zone 3 Mastery Check',
      subtitle: 'No preview — prove it',
      adaptive: true,
      config: negativeSlopeLevel({
        id: 'z3-l5',
        name: 'Zone 3 Mastery Check',
        learningGoal:
          'No aiming line. Each pair of asteroids sits on one falling line — work out its negative slope, then Fire. Clear all four.',
        // Two falling lines; a flat (m=0) shot can't clear a pair at two heights.
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: -3 }, points: 100 }, // y = -3x
          { id: 'a2', weakPoint: { x: 2, y: -6 }, points: 100 }, // y = -3x
          { id: 'a3', weakPoint: { x: 2, y: -1 }, points: 100 }, // y = -0.5x
          { id: 'a4', weakPoint: { x: 8, y: -4 }, points: 100 }, // y = -0.5x
        ],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  // End-of-zone reflection (shown once, after the mastery check).
  reflections: [
    {
      prompt: 'What does a negative slope do?',
      options: ['Makes the shot fall as it moves right', 'Makes the shot rise as it moves right', 'Keeps the shot flat'],
      correctIndex: 0,
      explanation:
        'A negative slope means y goes down as x goes up — the line heads downward into Quadrant IV. A positive slope climbs up and off the top.',
    },
    {
      prompt: 'A target sits down and to the right. The slope you need is…',
      options: ['Negative', 'Positive', 'Zero'],
      correctIndex: 0,
      explanation: 'Down-and-right means the line must fall as x grows, and only a negative slope falls. Zero stays flat; positive climbs.',
    },
    {
      prompt: 'Which falls faster, a slope of -3 or a slope of -1?',
      options: ['-3 (steeper)', '-1 (steeper)', 'They fall the same'],
      correctIndex: 0,
      explanation: 'The larger the size of the slope, the steeper the line. -3 drops three down for every one across — steeper than -1.',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do you work out a negative slope from a target’s coordinates?',
      'Why does a positive slope miss every asteroid in this zone?',
      'What is the difference between a slope of -2 and a slope of -1/2?',
    ],
  },
};
