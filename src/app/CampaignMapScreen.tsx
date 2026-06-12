import { motion } from 'framer-motion';
import type { Zone } from '../game/campaign/types';
import { ScreenChrome } from './ScreenChrome';
import type { CampaignProgress } from './useCampaignProgress';
import { staggerContainer, staggerItem, fadeInUp } from './animation';

interface CampaignMapScreenProps {
  zones: Zone[];
  progress: CampaignProgress;
  onSelectZone: (zoneId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  onToggleView: () => void;
  onOpenProfile?: () => void;
  toggleViewIcon?: 'planet';
  backLabel?: string;
}

export function CampaignMapScreen({
  zones,
  progress,
  onSelectZone,
  onBack,
  onOpenSettings,
  onToggleView,
  onOpenProfile,
  toggleViewIcon = 'planet',
  backLabel = 'Modes',
}: CampaignMapScreenProps) {
  return (
    <ScreenChrome
      onBack={onBack}
      backLabel={backLabel}
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
      toggleViewLabel="Planet view"
      toggleViewIcon={toggleViewIcon}
      onOpenProfile={onOpenProfile}
    >
      <section className="level-select" aria-labelledby="campaign-title">
        <motion.div
          className="level-select__header"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <div>
            <span className="menu__panel-label">Campaign</span>
            <h2 id="campaign-title">Choose a Zone</h2>
          </div>
          <p>Clear each zone to unlock the next</p>
        </motion.div>

        <motion.div
          className="level-grid level-grid--zones"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {zones.map((zone) => {
            const unlocked = zone.status === 'available' && progress.isZoneUnlocked(zone.id);
            const complete = progress.isZoneComplete(zone.id);
            const cleared = progress.zoneClearedCount(zone.id);
            const heading = zone.number === 0 ? zone.name : `Zone ${zone.number}: ${zone.name}`;
            return (
              <motion.div key={zone.id} variants={staggerItem}>
                <button
                  type="button"
                  className={`level-card ${unlocked ? 'level-card--selected' : ''} ${complete ? 'level-card--complete' : ''}`}
                  disabled={!unlocked}
                  onClick={() => onSelectZone(zone.id)}
                >
                  <span className="level-card__number" aria-hidden>
                    {zone.status !== 'available' ? '🔒' : complete ? '★' : String(zone.number)}
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
              </motion.div>
            );
          })}
        </motion.div>
      </section>
    </ScreenChrome>
  );
}