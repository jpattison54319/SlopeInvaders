import type { Zone } from '../game/campaign/types';
import { ScreenChrome } from './ScreenChrome';
import type { CampaignProgress } from './useCampaignProgress';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem, fadeInUp } from './animation';

interface ZoneLevelsScreenProps {
  zone: Zone;
  progress: CampaignProgress;
  onSelectLevel: (levelId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onToggleView: () => void;
  toggleViewIcon?: 'planet';
}

export function ZoneLevelsScreen({
  zone,
  progress,
  onSelectLevel,
  onBack,
  onOpenSettings,
  onToggleView,
  toggleViewIcon = 'planet',
}: ZoneLevelsScreenProps) {
  const zoneLabel = zone.number === 0 ? 'Tutorial' : `Zone ${zone.number}`;

  return (
    <ScreenChrome
      onBack={onBack}
      backLabel="Campaign"
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
      toggleViewLabel="Planet view"
      toggleViewIcon={toggleViewIcon}
    >
      <section className="level-select" aria-labelledby="zone-title">
        <motion.div
          className="level-select__header"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <span className="menu__panel-label">{zoneLabel} · {zone.theme}</span>
            <h2 id="zone-title">{zone.name}</h2>
          </div>
          <p>{zone.levels.length} levels</p>
        </motion.div>

        <motion.div
          className="level-grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {zone.levels.map((level, index) => {
            const unlocked = progress.isLevelUnlocked(zone, index);
            const complete = progress.isLevelComplete(level.id);
            return (
              <motion.div key={level.id} variants={staggerItem}>
                <button
                  type="button"
                  className={`level-card ${unlocked ? 'level-card--selected' : ''} ${complete ? 'level-card--complete' : ''}`}
                  disabled={!unlocked}
                  onClick={() => onSelectLevel(level.id)}
                >
                  <span className="level-card__number" aria-hidden>
                    {complete ? '★' : unlocked ? String(index + 1) : '🔒'}
                  </span>
                  <span className="level-card__body">
                    <strong>{level.name}</strong>
                    <span>{level.subtitle}</span>
                  </span>
                  <span className={`level-card__status ${unlocked ? 'level-card__status--ready' : ''}`}>
                    {complete ? 'Cleared' : unlocked ? 'Ready' : 'Locked'}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </ScreenChrome>
  );
}