import type { Zone } from '../game/campaign/types';
import { ScreenChrome } from './ScreenChrome';
import type { CampaignProgress } from './useCampaignProgress';

interface ZoneLevelsScreenProps {
  zone: Zone;
  progress: CampaignProgress;
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  /** Toggle back to the galaxy planet view. */
  onToggleView: () => void;
}

/** Level select within a zone, with sequential unlocking + completion ticks. */
export function ZoneLevelsScreen({
  zone,
  progress,
  onSelectLevel,
  onBack,
  onOpenSettings,
  onToggleView,
}: ZoneLevelsScreenProps) {
  const zoneLabel = zone.number === 0 ? 'Tutorial' : `Zone ${zone.number}`;

  return (
    <ScreenChrome
      onBack={onBack}
      backLabel="Campaign"
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
      toggleViewLabel="Planet view"
    >
      <section className="level-select" aria-labelledby="zone-title">
        <div className="level-select__header">
          <div>
            <span className="menu__panel-label">{zoneLabel} · {zone.theme}</span>
            <h2 id="zone-title">{zone.name}</h2>
          </div>
          <p>{zone.levels.length} levels</p>
        </div>

        <div className="level-grid">
          {zone.levels.map((level, index) => {
            const unlocked = progress.isLevelUnlocked(zone, index);
            const complete = progress.isLevelComplete(level.id);
            return (
              <button
                type="button"
                key={level.id}
                className={`level-card ${unlocked ? 'level-card--selected' : ''} ${complete ? 'level-card--complete' : ''}`}
                disabled={!unlocked}
                onClick={() => onSelectLevel(level.id)}
              >
                <span className="level-card__number" aria-hidden>
                  {complete ? '★' : unlocked ? index + 1 : '🔒'}
                </span>
                <span className="level-card__body">
                  <strong>{level.name}</strong>
                  <span>{level.subtitle}</span>
                </span>
                <span className={`level-card__status ${unlocked ? 'level-card__status--ready' : ''}`}>
                  {complete ? 'Cleared' : unlocked ? 'Ready' : 'Locked'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </ScreenChrome>
  );
}
