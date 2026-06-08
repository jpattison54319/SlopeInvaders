import type { Zone } from '../types';
import { interceptLevel } from './helpers';

/**
 * Zone 2 — Intercept Training. Quadrant I, slope + y-intercept (b) adjustable,
 * x-offset locked, coordinates visible, trajectory preview on. Zone 1 taught
 * slope (m) from the origin; Zone 2 unlocks b so the line no longer has to pass
 * through (0, 0): b is where the line crosses the y-axis at (0, b), and raising
 * b slides the whole line up.
 *
 * Scaffold mirrors Zone 1: a fixed diagnostic, guided practice, harder
 * dimmed/sequential practice, then a no-preview mastery check. Reflection +
 * debrief happen once, at the end.
 *
 * Design note (intentional): single targets can be "cheesed" with a horizontal
 * line y = b. That is allowed here — students are meant to discover horizontal
 * shots — so Zone 2 ships no blockers/walls. The mastery check instead uses
 * pairs of targets on one slanted line, which a flat line cannot clear, forcing
 * a correctly computed slope *and* intercept.
 *
 * Adaptivity: `z2-l1` is the fixed standard diagnostic; the rest are `adaptive`,
 * so hearts/scaffolds shift with the learner's recent Zone-2 performance (see
 * ../difficulty.ts). `z2-l2` and `z2-l3` add an extra target at the challenge
 * tier; the others rely on the rule transform.
 */
export const zoneTwo: Zone = {
  id: 'zone-2',
  number: 2,
  name: 'Intercept Training',
  theme: 'Meet the y-intercept (b)',
  status: 'available',
  levels: [
    {
      id: 'z2-l1',
      name: 'Lift Off the Origin',
      subtitle: 'Raise b to lift the line',
      config: interceptLevel({
        id: 'z2-l1',
        name: 'Lift Off the Origin',
        learningGoal:
          'The y-intercept b is where the line crosses the y-axis at (0, b). Keep the slope at 1 and raise b until the line lifts onto (1, 3) and (4, 6).',
        // Both lie on y = x + 2. Slope stays at the default m = 1; only b rises 0 → 2.
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 3 }, points: 100 },
          { id: 'a2', weakPoint: { x: 4, y: 6 }, points: 100 },
        ],
        hearts: 5,
        callout:
          'Your line starts at (0, b). With m = 1 it climbs one up for each step across — raise b to slide the whole line up onto both asteroids.',
      }),
    },
    {
      id: 'z2-l2',
      name: 'Flat Lines',
      subtitle: 'Horizontal lines (y = b)',
      adaptive: true,
      // Challenge adds a target off the flat row, needing a second shot.
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 2, y: 5 }, points: 100 },
            { id: 'a2', weakPoint: { x: 7, y: 5 }, points: 100 },
            { id: 'a3', weakPoint: { x: 4, y: 8 }, points: 100 }, // off the y = 5 row
          ],
        },
      },
      config: interceptLevel({
        id: 'z2-l2',
        name: 'Flat Lines',
        learningGoal:
          'A line with slope 0 is flat: y = b. Drop the slope to 0, then set b so the horizontal line runs through both asteroids.',
        // (2,5) and (7,5) share the horizontal line y = 5 → m = 0, b = 5.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 5 }, points: 100 },
          { id: 'a2', weakPoint: { x: 7, y: 5 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'When m = 0 there is no rise — the line is horizontal at height b. What single height clears both targets?',
      }),
    },
    {
      id: 'z2-l3',
      name: 'Same Slope, New Height',
      subtitle: 'Same m, different b',
      adaptive: true,
      // Challenge adds a third same-slope target at yet another intercept.
      variants: {
        challenge: {
          asteroids: [
            { id: 'a1', weakPoint: { x: 2, y: 4 }, points: 100 }, // y = x + 2
            { id: 'a2', weakPoint: { x: 5, y: 6 }, points: 100 }, // y = x + 1
            { id: 'a3', weakPoint: { x: 1, y: 5 }, points: 100 }, // y = x + 4
          ],
        },
      },
      config: interceptLevel({
        id: 'z2-l3',
        name: 'Same Slope, New Height',
        learningGoal:
          'Same slope, different intercept. Hit (2, 4) and (5, 6) — both need slope 1, but a different b. Fire one, change b, then fire again.',
        // Parallel slope-1 lines: (2,4) on y = x + 2, (5,6) on y = x + 1.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 4 }, points: 100 },
          { id: 'a2', weakPoint: { x: 5, y: 6 }, points: 100 },
        ],
        hearts: 4,
        callout:
          'Two parallel lines (same m) sit at different heights. Find the b that puts the slope-1 line through each target.',
      }),
    },
    {
      id: 'z2-l4',
      name: 'Read the Line',
      subtitle: 'Pick m and b — one at a time',
      adaptive: true,
      config: interceptLevel({
        id: 'z2-l4',
        name: 'Read the Line',
        learningGoal:
          'Each glowing asteroid needs its own slope and intercept. Read its coordinates, set m and b, then Fire. Some intercepts are fractions — b nudges by 0.5.',
        // Each target a distinct (m, b); a3 and a4 use fractional intercepts.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 5 }, points: 100 }, // y = x + 3
          { id: 'a2', weakPoint: { x: 4, y: 4 }, points: 100 }, // y = 0.5x + 2
          { id: 'a3', weakPoint: { x: 1, y: 4 }, points: 100 }, // y = 1.5x + 2.5
          { id: 'a4', weakPoint: { x: 5, y: 3 }, points: 100 }, // y = 0.5x + 0.5
        ],
        hearts: 4,
        sequentialTargets: true,
        trajectoryStyle: 'dimmed',
        callout:
          'Pick a slope, then nudge b — including half-steps like 0.5 — until the dim line passes through the glowing target.',
      }),
    },
    {
      id: 'z2-l5',
      name: 'Zone 2 Mastery Check',
      subtitle: 'No preview — find the line',
      adaptive: true,
      config: interceptLevel({
        id: 'z2-l5',
        name: 'Zone 2 Mastery Check',
        learningGoal:
          'No aiming line. Each pair of asteroids sits on one straight line — work out its slope and intercept, then Fire. Clear all four.',
        // Two slanted lines; a horizontal shot can't clear a pair at two heights.
        asteroids: [
          { id: 'a1', weakPoint: { x: 1, y: 3 }, points: 100 }, // y = x + 2
          { id: 'a2', weakPoint: { x: 4, y: 6 }, points: 100 }, // y = x + 2
          { id: 'a3', weakPoint: { x: 2, y: 2 }, points: 100 }, // y = 0.5x + 1
          { id: 'a4', weakPoint: { x: 6, y: 4 }, points: 100 }, // y = 0.5x + 1
        ],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  // End-of-zone reflection (shown once, after the mastery check).
  reflections: [
    {
      prompt: 'What does the y-intercept b do?',
      options: ['Moves the ship up and down', 'Changes how steep the shot is', 'Moves the asteroid'],
      correctIndex: 0,
      explanation:
        'b sets where your ship starts on the y-axis, at (0, b), so raising b lifts the ship (and the whole shot) straight up. The slope (m) is what sets the steepness.',
    },
    {
      prompt: 'Where does the line cross the y-axis?',
      options: ['At (0, b)', 'At (b, 0)', 'Always at the origin'],
      correctIndex: 0,
      explanation: 'Set x = 0 in y = mx + b and you get y = b, so the line crosses the y-axis at (0, b).',
    },
    {
      prompt: 'A line y = 4 (slope 0) is…',
      options: ['Horizontal', 'Vertical', 'Diagonal'],
      correctIndex: 0,
      explanation: 'With m = 0 there is no rise, so y stays at 4 everywhere — a flat, horizontal line.',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do you find b for a line that must pass through a given point?',
      'What happens to the line when you increase b but keep the slope the same?',
      'When can a flat (horizontal) line clear a target, and when does it fail?',
    ],
  },
};
