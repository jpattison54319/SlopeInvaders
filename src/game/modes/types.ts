/**
 * Game modes are declared separately from their content so app routing and the
 * mode-select screen can evolve without coupling their gameplay systems.
 */
export type GameModeId = 'campaign' | 'arcade' | 'versus';

export type ModeStatus = 'available' | 'coming-soon';

export interface ModeDescriptor {
  id: GameModeId;
  name: string;
  tagline: string;
  /** Longer blurb for the mode card. */
  description: string;
  status: ModeStatus;
}
