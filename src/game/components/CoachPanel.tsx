import type { ReactNode } from 'react';
import { uiCoach } from '../../assets/assetMap';

interface CoachPanelProps {
  title?: string;
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning';
  compact?: boolean;
  className?: string;
}

/** A restrained Mission Control message used for instruction and feedback. */
export function CoachPanel({
  title = 'Mission Control',
  children,
  tone = 'neutral',
  compact = false,
  className = '',
}: CoachPanelProps) {
  return (
    <aside
      className={`coach-panel coach-panel--${tone} ${compact ? 'coach-panel--compact' : ''} ${className}`.trim()}
      aria-label={title}
    >
      <img className="coach-panel__portrait" src={uiCoach.missionControl} alt="" draggable={false} />
      <div className="coach-panel__message">
        <span className="coach-panel__eyebrow">{title}</span>
        <div className="coach-panel__body">{children}</div>
      </div>
    </aside>
  );
}
