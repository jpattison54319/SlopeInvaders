import type { Zone } from '../game/campaign/types';
import { ScreenChrome } from './ScreenChrome';
import type { CampaignProgress } from './useCampaignProgress';

interface CampaignMapScreenProps {
  zones: Zone[];
  progress: CampaignProgress;
  onSelectZone: (zoneId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  /** Toggle back to the galaxy planet view. */
  onToggleView: () => void;
  /** Label/tooltip for the back control (defaults to "Modes"). */
  backLabel?: string;
}

/** The campaign zone map: pick a zone (locked until the previous is cleared). */
export function CampaignMapScreen({
  zones,
  progress,
  onSelectZone,
  onBack,
  onOpenSettings,
  onToggleView,
  backLabel = 'Modes',
}: CampaignMapScreenProps) {
  return (
    <ScreenChrome
      onBack={onBack}
      backLabel={backLabel}
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
      toggleViewLabel="Planet view"
    >
      <section className="level-select" aria-labelledby="campaign-title">
        <div className="level-select__header">
          <div>
            <span className="menu__panel-label">Campaign</span>
            <h2 id="campaign-title">Choose a Zone</h2>
          </div>
          <p>Clear each zone to unlock the next</p>
        </div>

        <div className="level-grid level-grid--zones">
          {zones.map((zone) => {
            const unlocked = zone.status === 'available' && progress.isZoneUnlocked(zone.id);
            const complete = progress.isZoneComplete(zone.id);
            const cleared = progress.zoneClearedCount(zone.id);
            const heading = zone.number === 0 ? zone.name : `Zone ${zone.number}: ${zone.name}`;
            return (
              <button
                type="button"
                key={zone.id}
                className={`level-card ${unlocked ? 'level-card--selected' : ''} ${complete ? 'level-card--complete' : ''}`}
                disabled={!unlocked}
                onClick={() => onSelectZone(zone.id)}
              >
                <span className="level-card__number" aria-hidden>
                  {zone.status !== 'available' ? '🔒' : complete ? '★' : zone.number}
                </span>
                <span className="level-card__body">
                  <strong>{heading}</strong>
                  <span>{zone.theme}</span>
                </span>
                <span className={`level-card__status ${unlocked ? 'level-card__status--ready' : ''}`}>
                  {zone.status !== 'available'
                    ? 'Coming Soon'
                    : !unlocked
                      ? 'Locked'
                      : `${cleared}/${zone.levels.length} cleared`}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </ScreenChrome>
  );
}
