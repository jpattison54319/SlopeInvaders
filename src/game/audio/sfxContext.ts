import { createContext, useContext } from 'react';
import type { SfxKey } from '../../assets/assetMap';

export interface SfxApi {
  play: (key: SfxKey) => void;
  playLaser: () => void;
  playExplosion: () => void;
  playButton: () => void;
}

export const noopSfx: SfxApi = {
  play: () => {},
  playLaser: () => {},
  playExplosion: () => {},
  playButton: () => {},
};

export const SfxContext = createContext<SfxApi>(noopSfx);

/** Access the sound-effect players. Returns no-ops if no provider is mounted. */
export function useSfx(): SfxApi {
  return useContext(SfxContext);
}
