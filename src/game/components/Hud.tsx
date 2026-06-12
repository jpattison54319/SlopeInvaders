import { type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sprites, uiHud } from '../../assets/assetMap';
import type { ShotFeedback } from '../logic/hints';
import { CoachPanel } from './CoachPanel';
import { TacticalStatusRail } from './TacticalPanel';
import { fadeInUp } from '../../app/animation';

interface HudProps {
  score: number;
  remaining: number;
  total: number;
  shotsFired: number;
  feedback: ShotFeedback | null;
  won: boolean;
  hearts?: number;
  maxHearts?: number;
}

export function Hud({
  score,
  remaining,
  total,
  shotsFired,
  feedback,
  won,
  hearts,
  maxHearts,
}: HudProps) {
  const destroyedCount = total - remaining;
  const showHearts = typeof maxHearts === 'number' && Number.isFinite(maxHearts) && maxHearts > 0;
  const heartCount = typeof hearts === 'number' ? hearts : 0;

  return (
    <div className="hud">
      {showHearts && (
        <div
          className="hud__hearts"
          data-tour="hearts"
          role="img"
          aria-label={`${heartCount} of ${maxHearts} hearts remaining`}
          style={{ '--health-rail': `url(${uiHud.healthRail})` } as CSSProperties}
        >
          {Array.from({ length: maxHearts }).map((_, i) => (
            <motion.img
              key={i}
              className="hud__heart"
              src={i < heartCount ? sprites.heartFull : sprites.heartEmpty}
              alt=""
              draggable={false}
              animate={i < heartCount ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0.4 }}
              transition={{ duration: 0.2 }}
            />
          ))}
        </div>
      )}

      <TacticalStatusRail
        className="hud__stats"
        label="Mission statistics"
        items={[
          { label: 'Score', value: score },
          { label: 'Targets', value: `${destroyedCount}/${total}` },
          { label: 'Shots', value: shotsFired },
        ]}
      />

      <AnimatePresence mode="wait">
        {won ? (
          <motion.div
            key="win"
            className="feedback feedback--win"
            data-tour="hint"
            role="status"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
          >
            <CoachPanel title="Mission Control" tone="success" compact>
              <strong>Victory!</strong>
              <p>
                All asteroids cleared in {shotsFired} shot{shotsFired === 1 ? '' : 's'}. Final
                score: {score}.
              </p>
            </CoachPanel>
          </motion.div>
        ) : feedback ? (
          <motion.div
            key={feedback.hit ? 'hit' : `miss-${feedback.detail}`}
            className={`feedback ${feedback.hit ? 'feedback--hit' : 'feedback--miss'}`}
            data-tour="hint"
            role="status"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
          >
            <CoachPanel title="Mission Control" tone={feedback.hit ? 'success' : 'warning'} compact>
              <strong>{feedback.headline}</strong>
              <p>{feedback.detail}</p>
            </CoachPanel>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            className="feedback feedback--idle"
            data-tour="hint"
            role="status"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ type: 'tween', duration: 0.12, ease: 'easeOut' }}
          >
            <CoachPanel title="Mission Control" compact>
              <strong>Ready.</strong>
              <p>Set your equation, check the dashed trajectory, then Fire.</p>
            </CoachPanel>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}