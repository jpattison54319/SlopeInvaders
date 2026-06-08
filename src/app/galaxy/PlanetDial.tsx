import type { ReactNode } from 'react';
import type { Zone } from '../../game/campaign/types';
import { planetSrcForZone } from '../../game/campaign/planets';
import type { CampaignProgress } from '../useCampaignProgress';

interface PlanetDialProps {
  zones: Zone[];
  activeIndex: number;
  progress: CampaignProgress;
  /** Rotate the dial so this zone index becomes the center (side planets only). */
  onRotateTo: (index: number) => void;
  /** Enter the active center planet's mission surface. */
  onEnterCenter: () => void;
  /** Optional overlay aligned to the center planet. */
  children?: ReactNode;
}

/** Slot a planet occupies relative to the active center, by signed offset. */
const SLOT: Record<number, string> = {
  [-2]: 'far-left',
  [-1]: 'left',
  [0]: 'center',
  [1]: 'right',
  [2]: 'far-right',
};

/**
 * The rotating planet dial: the center planet is large + raised, the flanking
 * planets are smaller + lowered. Nodes are keyed by zone id and positioned by a
 * slot class, so changing `activeIndex` lets CSS transitions animate the spin.
 */
export function PlanetDial({
  zones,
  activeIndex,
  progress,
  onRotateTo,
  onEnterCenter,
  children,
}: PlanetDialProps) {
  return (
    <div className="planet-dial" role="group" aria-label="Planet selector">
      {zones.map((zone, i) => {
        const offset = i - activeIndex;
        if (Math.abs(offset) > 2) return null;
        const slot = SLOT[offset];
        const isCenter = offset === 0;

        const locked = zone.status !== 'available' || !progress.isZoneUnlocked(zone.id);
        const complete = progress.isZoneComplete(zone.id);
        const cleared = progress.zoneClearedCount(zone.id);
        const total = zone.levels.length;
        const disabled = isCenter && (locked || total === 0);
        const label = isCenter
          ? `Enter ${zone.name}`
          : `Travel to ${zone.name}`;

        return (
          <button
            key={zone.id}
            type="button"
            className={`planet planet--${slot} ${locked ? 'planet--locked' : ''}`}
            disabled={disabled}
            aria-hidden={Math.abs(offset) === 2}
            aria-label={label}
            onClick={() => {
              if (isCenter) {
                onEnterCenter();
              } else {
                onRotateTo(i);
              }
            }}
          >
            <img
              className="planet__img"
              src={planetSrcForZone(zone.id)}
              alt={isCenter ? zone.name : ''}
              draggable={false}
            />
            {locked ? (
              <span className="planet__lock" aria-hidden="true">🔒</span>
            ) : (
              <span className="planet__badge">{complete ? '★' : `${cleared}/${total}`}</span>
            )}
          </button>
        );
      })}
      {children}
    </div>
  );
}
