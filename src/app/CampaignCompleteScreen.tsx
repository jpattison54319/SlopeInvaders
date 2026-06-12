import { useMemo, type CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { ScreenChrome } from './ScreenChrome';
import { Fireworks } from '../game/components/Fireworks';
import { orderedLevels } from '../game/campaign/zones';
import type { CampaignProgress } from './useCampaignProgress';
import { uiCoach, uiResults } from '../assets/assetMap';
import { TacticalButton } from '../game/components/TacticalButton';
import { popIn, staggerContainer, staggerItem, fadeInUp } from './animation';

interface CampaignCompleteScreenProps {
  progress: CampaignProgress;
  reducedMotion: boolean;
  onMenu: () => void;
  onGalaxy: () => void;
  onOpenSettings: () => void;
}

export function CampaignCompleteScreen({
  progress,
  reducedMotion,
  onMenu,
  onGalaxy,
  onOpenSettings,
}: CampaignCompleteScreenProps) {
  const { earnedStars, maxStars } = useMemo(() => {
    const earned = orderedLevels.reduce((sum, { level }) => sum + progress.getLevelStars(level.id), 0);
    return { earnedStars: earned, maxStars: orderedLevels.length * 3 };
  }, [progress]);

  const profile = progress.getProfileStats();
  const accuracy = profile.totalShots > 0 ? Math.round((profile.totalHits / profile.totalShots) * 100) : 100;

  return (
    <ScreenChrome onBack={onMenu} backLabel="Main Menu" onOpenSettings={onOpenSettings}>
      <Fireworks reducedMotion={reducedMotion} />
      <section
        className="debrief campaign-complete"
        aria-labelledby="campaign-complete-title"
        style={{ '--result-frame': `url(${uiResults.victoryFrame})` } as CSSProperties}
      >
        <motion.img
          className="campaign-complete__coach"
          src={uiCoach.victoryControl}
          alt=""
          draggable={false}
          variants={popIn}
          initial="initial"
          animate="animate"
        />
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <span className="menu__panel-label">Campaign Complete</span>
          <h2 id="campaign-complete-title">You beat Slope Invaders!</h2>
        </motion.div>
        <motion.p
          className="debrief__intro"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.1 }}
        >
          All eight zones cleared, pilot. You mastered slope, intercepts, every quadrant, walls,
          chains, allies, and the moving cannon. The galaxy is safe.
        </motion.p>

        <motion.p
          className="campaign-complete__stars"
          aria-label={`${earnedStars} of ${maxStars} stars earned`}
          variants={popIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        >
          ★ {earnedStars} / {maxStars}
        </motion.p>

        <motion.ul
          className="campaign-complete__stats"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.li variants={staggerItem}>
            <span>Levels cleared</span>
            <strong>{orderedLevels.length}</strong>
          </motion.li>
          <motion.li variants={staggerItem}>
            <span>Lifetime accuracy</span>
            <strong>{accuracy}%</strong>
          </motion.li>
          <motion.li variants={staggerItem}>
            <span>Shots fired</span>
            <strong>{profile.totalShots}</strong>
          </motion.li>
        </motion.ul>

        <motion.div
          className="campaign-complete__actions"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.3 }}
        >
          <TacticalButton asset="replay" label="Replay Campaign" text="Replay Campaign" size="large" onClick={onGalaxy} />
          <TacticalButton asset="back" label="Back to Menu" text="Back to Menu" size="large" onClick={onMenu} />
        </motion.div>
      </section>
    </ScreenChrome>
  );
}