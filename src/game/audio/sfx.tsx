import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { sfx as sfxUrls, type SfxKey } from '../../assets/assetMap';
import { SfxContext, type SfxApi } from './sfxContext';

interface SfxProviderProps {
  volume: number;
  muted: boolean;
  children: ReactNode;
}

/**
 * Provides one-shot sound effects. SFX are always triggered by a user action
 * (Fire), so they sidestep autoplay restrictions. Each call makes a fresh Audio
 * so overlapping sounds (rapid hits) play cleanly. Volume/mute come from
 * settings and are read live via a ref.
 */
export function SfxProvider({ volume, muted, children }: SfxProviderProps) {
  const settings = useRef({ volume, muted });
  useEffect(() => {
    settings.current = { volume, muted };
  }, [volume, muted]);

  const api = useMemo<SfxApi>(() => {
    const play = (key: SfxKey) => {
      const { volume: vol, muted: isMuted } = settings.current;
      if (isMuted || vol <= 0 || typeof Audio === 'undefined') return;
      try {
        const audio = new Audio(sfxUrls[key]);
        audio.volume = Math.min(1, Math.max(0, vol));
        void audio.play().catch(() => {});
      } catch {
        /* ignore playback errors (e.g. unsupported environment) */
      }
    };
    return { play, playLaser: () => play('laser'), playExplosion: () => play('explosion') };
  }, []);

  return <SfxContext.Provider value={api}>{children}</SfxContext.Provider>;
}
