import type { ModeDescriptor } from './types';

/**
 * The mode catalog read by the Mode Select screen. Campaign is the focus of this
 * prototype. Runtime progression gates, such as Arcade's Campaign-completion
 * requirement, are applied by the app shell rather than duplicated here.
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
    tagline: 'Endless equation defense.',
    description:
      'Survive escalating waves, intercept falling asteroids, and set a personal high score.',
    status: 'available',
  },
  {
    id: 'versus',
    name: 'Versus',
    tagline: 'Live 1v1 slope duel.',
    description:
      'Race a classmate to clear your asteroids on live side-by-side boards, with +2 and freeze attack pickups. Requires joining a class.',
    status: 'available',
  },
];

export type { GameModeId, ModeDescriptor, ModeStatus } from './types';
