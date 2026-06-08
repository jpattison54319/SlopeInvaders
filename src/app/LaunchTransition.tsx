import { useEffect } from 'react';

interface LaunchTransitionProps {
  /** Planet sprite the ship is diving toward. */
  planetSrc: string;
  reducedMotion: boolean;
  /** Fired when the warp finishes (advance to gameplay). */
  onDone: () => void;
}

/**
 * A brief first-person "warp into the hotspot" flourish between the galaxy and
 * the mission UI: star streaks rush past while the target planet swells and a
 * cyan flash hands off to gameplay. Reduced motion collapses it to a quick fade.
 */
export function LaunchTransition({ planetSrc, reducedMotion, onDone }: LaunchTransitionProps) {
  useEffect(() => {
    const ms = reducedMotion ? 180 : 980;
    const id = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(id);
  }, [onDone, reducedMotion]);

  return (
    <div className={`launch-warp ${reducedMotion ? 'launch-warp--reduced' : ''}`} aria-hidden="true">
      <div className="launch-warp__stars" />
      <img className="launch-warp__planet" src={planetSrc} alt="" draggable={false} />
      <div className="launch-warp__flash" />
      <p className="launch-warp__label">Approaching target…</p>
    </div>
  );
}
