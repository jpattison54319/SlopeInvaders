import { useState } from 'react';
import { motion } from 'framer-motion';
import type { ArcadeRecords } from '../game/arcade/types';
import { CoachPanel } from '../game/components/CoachPanel';
import { TacticalButton } from '../game/components/TacticalButton';
import { TacticalPanel, TacticalStatusRail } from '../game/components/TacticalPanel';
import { ScreenChrome } from './ScreenChrome';
import { fadeInUp, staggerContainer, staggerItem } from './animation';

interface ArcadeBriefingScreenProps {
  records: ArcadeRecords;
  onStart: (options: { noPreview: boolean }) => void;
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ArcadeBriefingScreen({
  records,
  onStart,
  onBack,
  onOpenSettings,
}: ArcadeBriefingScreenProps) {
  const [noPreview, setNoPreview] = useState(false);

  return (
    <ScreenChrome onBack={onBack} backLabel="Modes" onOpenSettings={onOpenSettings}>
      <section className="arcade-briefing" aria-labelledby="arcade-briefing-title">
        <motion.header
          className="arcade-briefing__header"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
        >
          <span className="menu__panel-label">Endless Equation Defense</span>
          <h1 id="arcade-briefing-title">Arcade Run</h1>
          <p>
            Intercept falling asteroids with <strong>y = mx + b</strong>. They pause at
            grid vertices, then descend again. Three breaches end the run.
          </p>
        </motion.header>

        <motion.div
          className="arcade-briefing__grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          <motion.div variants={staggerItem}>
            <TacticalPanel className="arcade-briefing__rules" tone="gold">
              <h2>Flight Plan</h2>
              <ol>
                <li>Read each visible coordinate and build a line through its core.</li>
                <li>Fire while it is parked, or earn a bonus by intercepting it mid-fall.</li>
                <li>Keep landing hits to raise your score multiplier.</li>
                <li>Each wave shortens the pause, but never below 2.75 seconds.</li>
              </ol>
              <p className="arcade-briefing__controls">
                Use the on-screen controls or your saved keyboard bindings. Change keyboard
                controls from Settings.
              </p>
            </TacticalPanel>
          </motion.div>

          <motion.div className="arcade-briefing__side" variants={staggerItem}>
            <CoachPanel title="Mission Control">
              <strong>Accuracy before speed.</strong>
              <p>
                The timer creates urgency, but the coordinate and equation remain the fastest
                route to a reliable shot.
              </p>
            </CoachPanel>
            <TacticalStatusRail
              label="Arcade personal records"
              items={[
                { label: 'High Score', value: records.highScore },
                { label: 'Best Wave', value: records.bestWave || '—' },
                { label: 'Best Streak', value: records.longestStreak || '—' },
              ]}
            />
            <TacticalPanel className="arcade-briefing__modifiers" tone="standard" style={{ marginTop: '1rem' }}>
              <h3>Modifiers</h3>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
                <div style={{ paddingRight: '12px' }}>
                  <strong style={{ color: '#fff', fontSize: '0.82rem', display: 'block' }}>No Aim Preview</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Hide the trajectory preview line. Activates 50% bonus XP!
                  </span>
                </div>
                <TacticalButton
                  asset={noPreview ? 'confirm' : 'back'}
                  label="Toggle no-preview modifier"
                  text={noPreview ? 'ON (+50% XP)' : 'OFF'}
                  size="small"
                  onClick={() => setNoPreview(!noPreview)}
                  style={{ minWidth: '135px' }}
                />
              </div>
            </TacticalPanel>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.15 }}
        >
          <TacticalButton
            asset="play"
            label="Start Arcade Run"
            text="Start Run"
            size="large"
            className="arcade-briefing__start"
            onClick={() => onStart({ noPreview })}
          />
        </motion.div>
      </section>
    </ScreenChrome>
  );
}