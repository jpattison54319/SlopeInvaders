import { useEffect, useRef } from 'react';
import { useFocusTrap } from '../../app/useFocusTrap';
import { uiCoach } from '../../assets/assetMap';
import { TacticalButton } from './TacticalButton';

interface MissionBriefingProps {
  /** The level's learning goal — the objective the player must read. */
  objective: string;
  levelNumberLabel: string;
  title: string;
  /** Dismiss the briefing and begin the level. */
  onBegin: () => void;
}

/**
 * A one-time-per-level briefing the player must dismiss before playing, so the
 * objective is read rather than skipped (testers ignored the inline banner).
 * Focus-trapped like the other modals; Enter / Escape both begin the mission.
 */
export function MissionBriefing({ objective, levelNumberLabel, title, onBegin }: MissionBriefingProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        onBegin();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBegin]);

  return (
    <div className="level-briefing" role="dialog" aria-modal="true" aria-label="Mission briefing">
      <div className="level-briefing__panel" ref={panelRef}>
        <img className="level-briefing__coach" src={uiCoach.missionControl} alt="" draggable={false} />
        <span className="level-briefing__level">{levelNumberLabel} · {title}</span>
        <span className="level-briefing__eyebrow">Objective</span>
        <p className="level-briefing__objective">{objective}</p>
        <TacticalButton
          asset="play"
          label="Begin mission"
          text="Begin Mission"
          size="large"
          className="level-briefing__begin"
          onClick={onBegin}
        />
      </div>
    </div>
  );
}
