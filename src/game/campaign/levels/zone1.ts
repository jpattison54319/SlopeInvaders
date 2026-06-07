import type { Zone } from '../types';
import { slopeLevel } from './helpers';

/**
 * Zone 1 — Slope Training. Quadrant I, slope only, b locked at 0, x-offset
 * locked, coordinates visible. The tutorial already introduced slope-as-angle,
 * so Zone 1 is practice: larger = steeper, fractional slopes, mixed practice,
 * then a no-preview mastery check. Reflection happens once, at the end.
 *
 * Every level requires changing the slope away from the default (m = 1) — no
 * target is reachable without doing the thing the level teaches.
 */
export const zoneOne: Zone = {
  id: 'zone-1',
  number: 1,
  name: 'Slope Training',
  theme: 'Slope as rise / run',
  status: 'available',
  levels: [
    {
      id: 'z1-l1',
      name: 'Steeper Lines',
      subtitle: 'Larger slope = steeper',
      config: slopeLevel({
        id: 'z1-l1',
        name: 'Steeper Lines',
        learningGoal:
          'A bigger slope makes a steeper line. Hit (3, 6) with one slope, then the steeper (2, 6) with another.',
        // (3,6) needs m=2; (2,6) needs the steeper m=3 — two distinct integer slopes.
        asteroids: [
          { id: 'a1', weakPoint: { x: 3, y: 6 }, points: 100 },
          { id: 'a2', weakPoint: { x: 2, y: 6 }, points: 100 },
        ],
        hearts: 5,
        callout: 'Rise over run from the origin: (3, 6) is 6 up over 3 across. The steeper the target, the bigger the slope.',
      }),
    },
    {
      id: 'z1-l2',
      name: 'Fractional Slopes',
      subtitle: 'Flatter lines (m = ½)',
      config: slopeLevel({
        id: 'z1-l2',
        name: 'Fractional Slopes',
        learningGoal:
          'Slopes can be fractions. A slope between 0 and 1 makes a flatter line — lower the slope to reach these.',
        // Both lie on y = ½x; the default m = 1 overshoots, so the slope must drop.
        asteroids: [
          { id: 'a1', weakPoint: { x: 4, y: 2 }, points: 100 },
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100 },
        ],
        hearts: 4,
        callout: 'These sit below the y = x line. From (0,0) to (4,2) the line rises 2 over a run of 4 — what fraction is that?',
      }),
    },
    {
      id: 'z1-l3',
      name: 'Mixed Slope Practice',
      subtitle: 'One target at a time',
      config: slopeLevel({
        id: 'z1-l3',
        name: 'Mixed Slope Practice',
        learningGoal:
          'Take out the glowing asteroid, then the next. Each needs a different slope — read its coordinates and aim.',
        // Sequential; first target requires a change away from the default m = 1.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 4 }, points: 100 }, // m = 2
          { id: 'a2', weakPoint: { x: 4, y: 2 }, points: 100 }, // m = 1/2
          { id: 'a3', weakPoint: { x: 4, y: 3 }, points: 100 }, // m = 3/4
          { id: 'a4', weakPoint: { x: 3, y: 3 }, points: 100 }, // m = 1
        ],
        hearts: 4,
        sequentialTargets: true,
        trajectoryStyle: 'dimmed',
        callout: 'Only the glowing asteroid can be hit. Work out each slope from its coordinates (rise ÷ run).',
      }),
    },
    {
      id: 'z1-l4',
      name: 'Zone 1 Mastery Check',
      subtitle: 'No preview — prove it',
      config: slopeLevel({
        id: 'z1-l4',
        name: 'Zone 1 Mastery Check',
        learningGoal:
          'No aiming line this time — calculate each slope from the origin (rise ÷ run), then Fire. Clear all three.',
        // Three distinct slopes, none equal to the default — a real check.
        asteroids: [
          { id: 'a1', weakPoint: { x: 2, y: 4 }, points: 100 }, // m = 2
          { id: 'a2', weakPoint: { x: 6, y: 3 }, points: 100 }, // m = 1/2
          { id: 'a3', weakPoint: { x: 1, y: 3 }, points: 100 }, // m = 3
        ],
        hearts: 3,
        trajectoryPreview: 'after-fire',
      }),
    },
  ],
  // End-of-zone reflection (shown once, after the mastery check).
  reflections: [
    {
      prompt: 'What did changing the slope do?',
      options: ['Changed the angle of the line', 'Moved the line up and down', 'Moved the asteroid'],
      correctIndex: 0,
      explanation:
        'Slope (m) sets the steepness — the angle — of the line. With b = 0 the line always starts at the origin and pivots as you change m.',
    },
    {
      prompt: 'A larger slope makes the laser…',
      options: ['Steeper', 'Flatter', 'It doesn’t change the line'],
      correctIndex: 0,
      explanation: 'Bigger slope = more rise per run = a steeper line.',
    },
    {
      prompt: 'A slope of 1/2 makes the line…',
      options: ['Flatter than slope 1', 'Steeper than slope 1', 'Vertical'],
      correctIndex: 0,
      explanation: 'A slope between 0 and 1 rises slowly, so the line is flatter than y = x.',
    },
  ],
  debrief: {
    title: 'Mission Debrief',
    prompts: [
      'How do you find the slope needed to hit an asteroid from the origin?',
      'What does a larger slope do to the laser?',
      'What is one mistake you made, and how did you fix it?',
    ],
  },
};
