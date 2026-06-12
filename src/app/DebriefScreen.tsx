import { motion } from 'framer-motion';
import type { Zone } from '../game/campaign/types';
import { ReflectionQuestionCard } from '../game/components/ReflectionQuestionCard';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { ScreenChrome } from './ScreenChrome';
import { staggerContainer, staggerItem, fadeInUp } from './animation';

interface DebriefScreenProps {
  zone: Zone;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function DebriefScreen({ zone, onBack, onOpenSettings }: DebriefScreenProps) {
  const reflections = zone.reflections ?? [];
  const debrief = zone.debrief;

  return (
    <ScreenChrome onBack={onBack} backLabel="Campaign" onOpenSettings={onOpenSettings}>
      <section className="debrief" aria-labelledby="debrief-title">
        <motion.div variants={fadeInUp} initial="initial" animate="animate">
          <span className="menu__panel-label">Zone {zone.number} Complete</span>
          <h2 id="debrief-title">{debrief?.title ?? 'Mission Debrief'}</h2>
          <CoachPanel tone="success">
            <p>Great work clearing {zone.name}. Review the decisions that made the route successful.</p>
          </CoachPanel>
        </motion.div>

        {reflections.length > 0 && (
          <motion.div
            className="debrief__quiz"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {reflections.map((question, i) => (
              <motion.div key={question.prompt} variants={staggerItem}>
                <ReflectionQuestionCard question={question} number={i + 1} />
              </motion.div>
            ))}
          </motion.div>
        )}

        {debrief && debrief.prompts.length > 0 && (
          <>
            <motion.h3
              className="debrief__subhead"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
            >
              Think it over
            </motion.h3>
            <motion.ol
              className="debrief__list"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              {debrief.prompts.map((prompt) => (
                <motion.li key={prompt} variants={staggerItem}>
                  {prompt}
                </motion.li>
              ))}
            </motion.ol>
          </>
        )}

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.2 }}
        >
          <TacticalButton
            asset="forward"
            label="Back to Campaign"
            text="Back to Campaign"
            size="large"
            className="debrief__continue"
            onClick={onBack}
          />
        </motion.div>
      </section>
    </ScreenChrome>
  );
}