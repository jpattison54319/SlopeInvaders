import type { ModeDescriptor } from './types';

/**
 * The mode catalog read by the Mode Select screen. Campaign is the focus of this
 * prototype; the others are placeholders kept here so the concept of "modes" is
 * visible and future modes drop in without touching existing code.
 */
export const modes: ModeDescriptor[] = [
  {
    id: 'campaign',
    name: 'Campaign',
    tagline: 'Learn linear equations zone by zone.',
    description:
      'A guided journey through zones of levels — slope, intercepts, and beyond — with hearts, hints, and reflections.',
    status: 'available',
  },
  {
    id: 'arcade',
    name: 'Arcade',
    tagline: 'Endless target practice.',
    description: 'Free play and high-score runs across any unlocked level. Coming soon.',
    status: 'coming-soon',
  },
  {
    id: 'versus',
    name: 'Versus',
    tagline: 'Two-player slope duel.',
    description: 'Head-to-head graphing battles. Coming soon.',
    status: 'coming-soon',
  },
];

export type { GameModeId, ModeDescriptor, ModeStatus } from './types';
