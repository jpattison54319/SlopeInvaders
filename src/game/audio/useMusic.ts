import { useEffect, useRef } from 'react';

/**
 * Play a single looping background-music track.
 *
 * Switching `track` swaps the source; `volume` (0..1) and `muted` update live
 * without restarting playback. Browser autoplay policies block audio until the
 * user interacts, so if the initial play() is rejected we retry on the first
 * pointer/key event.
 */
export function useMusic(track: string, volume: number, muted: boolean): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const removeUnlockRef = useRef<(() => void) | null>(null);

  // Lazily create the looping audio element once on the client.
  useEffect(() => {
    if (typeof Audio === 'undefined') return;

    const audio = new Audio();
    audio.loop = true;
    audio.preload = 'auto';
    audioRef.current = audio;

    return () => {
      audio.pause();
      removeUnlockRef.current?.();
      audioRef.current = null;
    };
  }, []);

  // Switch track + (re)start playback.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.src.endsWith(track) && audio.src !== track) {
      audio.src = track;
      audio.load();
    }
    audio.volume = volume;
    audio.muted = muted;

    const playResult = audio.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        // Autoplay blocked — start on the first user gesture.
        const unlock = () => {
          audio.play().catch(() => {});
          teardown();
        };
        const teardown = () => {
          window.removeEventListener('pointerdown', unlock);
          window.removeEventListener('keydown', unlock);
          removeUnlockRef.current = null;
        };
        removeUnlockRef.current?.(); // clear any earlier pending unlock
        removeUnlockRef.current = teardown;
        window.addEventListener('pointerdown', unlock);
        window.addEventListener('keydown', unlock);
      });
    }
    // Deliberately no pause-on-cleanup: only a track change should restart it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track]);

  // Live volume / mute updates.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.muted = muted;
  }, [volume, muted]);
}
