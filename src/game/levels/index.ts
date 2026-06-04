/**
 * Level registry — the catalog the menu's Level Select reads from.
 *
 * Only Level 1 ships with a playable `config`; the rest are placeholders so the
 * Level Select UI is future-proof. Add a level by giving its entry a real
 * LevelConfig and flipping `status` to 'available' — no UI changes needed.
 */
import type { LevelConfig } from './types';
import { levelOne } from './levelOne';

export type LevelStatus = 'available' | 'coming-soon';

export interface LevelEntry {
  id: string;
  /** Display number shown on the card. */
  number: number;
  name: string;
  /** One-line theme/skill tag. */
  subtitle: string;
  learningGoal: string;
  status: LevelStatus;
  /** Playable definition, or null for not-yet-built levels. */
  config: LevelConfig | null;
}

export const levels: LevelEntry[] = [
  {
    id: levelOne.id,
    number: 1,
    name: levelOne.name,
    subtitle: 'Quadrant I · y = mx + b',
    learningGoal: levelOne.learningGoal,
    status: 'available',
    config: levelOne,
  },
  {
    id: 'level-2',
    number: 2,
    name: 'Steep Descent',
    subtitle: 'Negative slopes',
    learningGoal: 'Aim with negative slopes to hit targets below the launch line.',
    status: 'coming-soon',
    config: null,
  },
  {
    id: 'level-3',
    number: 3,
    name: 'Four Corners',
    subtitle: 'All four quadrants',
    learningGoal: 'Work across all four quadrants with positive and negative coordinates.',
    status: 'coming-soon',
    config: null,
  },
  {
    id: 'level-4',
    number: 4,
    name: 'Shield Wall',
    subtitle: 'Walls & shield gaps',
    learningGoal: 'Thread your shot through gaps in asteroid shields.',
    status: 'coming-soon',
    config: null,
  },
  {
    id: 'level-5',
    number: 5,
    name: 'Linked Up',
    subtitle: 'Linked asteroids',
    learningGoal: 'Destroy linked asteroid groups with a single well-aimed line.',
    status: 'coming-soon',
    config: null,
  },
];

/** The first playable level — used by the menu's quick "Play" button. */
export const firstPlayableLevel: LevelConfig = levelOne;
