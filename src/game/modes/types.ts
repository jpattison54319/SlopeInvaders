/**
 * Game modes. Only Campaign is playable in this prototype; Arcade and
 * Multiplayer-Versus are declared so the Mode Select screen can show them as
 * "coming soon" and so future modes plug in by adding a descriptor + content
 * module + an App route — campaign code stays untouched.
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
