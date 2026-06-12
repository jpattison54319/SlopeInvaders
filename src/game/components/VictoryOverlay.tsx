import { type CSSProperties } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StarCount } from '../campaign/stars';
import type { XpAward } from '../campaign/xp';
import type { BadgeDef } from '../campaign/badges';
import { uiCoach, uiResults } from '../../assets/assetMap';
import { StarRating } from './StarRating';
import { TacticalButton } from './TacticalButton';
import { popIn, staggerContainer, staggerItem } from '../../app/animation';

interface VictoryOverlayProps {
  shotsFired: number;
  score: number;
  stars: StarCount;
  xp?: XpAward;
  newBadges?: BadgeDef[];
  hasNext: boolean;
  onAdvance: () => void;
  onReplay: () => void;
}

export function VictoryOverlay({
  shotsFired,
  score,
  stars,
  xp,
  newBadges,
  hasNext,
  onAdvance,
  onReplay,
}: VictoryOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        className="game-overlay"
        role="dialog"
        aria-label="Victory"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          className="game-overlay__panel game-overlay__panel--win game-overlay__panel--framed"
          style={{ '--result-frame': `url(${uiResults.victoryFrame})` } as CSSProperties}
          variants={popIn}
          initial="initial"
          animate="animate"
          transition={{ type: 'spring', stiffness: 250, damping: 20, delay: 0.1 }}
        >
          <img className="game-overlay__coach" src={uiCoach.victoryControl} alt="" draggable={false} />
          <motion.strong
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            Victory
          </motion.strong>
          <motion.p
            className="game-overlay__stats"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            Cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'} · Score {score}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.35 }}
          >
            <StarRating stars={stars} label="Mission stars" className="game-overlay__stars" size="large" />
          </motion.div>
          {xp && (
            <motion.div
              className="game-overlay__xp"
              aria-label="XP earned"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <ul className="xp-breakdown">
                {xp.bonuses.map((bonus) => (
                  <motion.li key={bonus.id} className="xp-row" variants={staggerItem}>
                    <span className="xp-row__text">
                      <span className="xp-row__label">{bonus.label}</span>
                      <span className="xp-row__reason">{bonus.reason}</span>
                    </span>
                    <span className="xp-row__points">+{bonus.points}</span>
                  </motion.li>
                ))}
              </ul>
              {xp.awardedXp > 0 ? (
                <motion.p
                  className="xp-banked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  +{xp.awardedXp} XP banked · {xp.newTotalXp} total
                </motion.p>
              ) : (
                <p className="xp-banked xp-banked--held">
                  Best run already banked — beat it to earn more XP
                </p>
              )}
            </motion.div>
          )}
          {newBadges && newBadges.length > 0 && (
            <motion.div
              className="game-overlay__badges"
              aria-label="Badges earned"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {newBadges.map((badge) => (
                <motion.div key={badge.id} className="badge-chip" variants={staggerItem}>
                  <span className="badge-chip__title">Badge earned!</span>
                  <span className="badge-chip__name">{badge.name}</span>
                  <span className="badge-chip__desc">{badge.description}</span>
                </motion.div>
              ))}
            </motion.div>
          )}
          <motion.div
            className="game-overlay__actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <TacticalButton
              asset="forward"
              label={hasNext ? 'Next Level' : 'Continue'}
              text={hasNext ? 'Next Level' : 'Continue'}
              size="large"
              onClick={onAdvance}
            />
            <TacticalButton asset="replay" label="Replay" text="Replay" size="large" onClick={onReplay} />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}