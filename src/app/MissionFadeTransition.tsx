import { useEffect } from 'react';

interface MissionFadeTransitionProps {
  reducedMotion: boolean;
  onDone: () => void;
}

/** A quiet screen fade from the surface map into gameplay. */
export function MissionFadeTransition({ reducedMotion, onDone }: MissionFadeTransitionProps) {
  useEffect(() => {
    const ms = reducedMotion ? 90 : 320;
    const id = window.setTimeout(onDone, ms);
    return () => window.clearTimeout(id);
  }, [onDone, reducedMotion]);

  return <div className={`mission-fade ${reducedMotion ? 'mission-fade--reduced' : ''}`} aria-hidden="true" />;
}
