import { useState } from 'react';
import { motion } from 'framer-motion';
import { assets, uiBackgrounds, uiShips } from '../assets/assetMap';
import { CoachPanel } from '../game/components/CoachPanel';
import { Modal } from '../game/components/Modal';
import { TacticalButton } from '../game/components/TacticalButton';
import { staggerContainer, staggerItem, fadeInUp, popIn } from './animation';
import type { GameModeId, ModeDescriptor } from '../game/modes';

interface MenuScreenProps {
  modes: ModeDescriptor[];
  arcadeUnlocked: boolean;
  onSelectMode: (id: GameModeId) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenClassroom: () => void;
}

/** The landing screen: title, how-to, and the game-mode selector. */
export function MenuScreen({
  modes,
  arcadeUnlocked,
  onSelectMode,
  onOpenSettings,
  onOpenProfile,
  onOpenClassroom,
}: MenuScreenProps) {
  const [briefingOpen, setBriefingOpen] = useState(false);
  const availableCount = modes.filter(
    (mode) => mode.status === 'available' && (mode.id !== 'arcade' || arcadeUnlocked),
  ).length;

  return (
    <main
      className="menu menu--tactical"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(4, 8, 24, 0.34), rgba(4, 8, 24, 0.84)), url(${uiBackgrounds.menu})`,
      }}
    >
      <nav className="menu__topbar" aria-label="Main menu">
        <div className="menu__brand">
          <img src={assets.ship} alt="" draggable={false} />
        </div>
        <div className="menu__actions">
          <TacticalButton asset="info" label="Mission briefing" size="small" onClick={() => setBriefingOpen(true)} />
          <TacticalButton asset="hangar" label="Classroom" size="small" onClick={onOpenClassroom} />
          <TacticalButton asset="profile" label="Pilot Profile" size="small" onClick={onOpenProfile} />
          <TacticalButton asset="settings" label="Settings" size="small" onClick={onOpenSettings} />
        </div>
      </nav>

      <section className="menu__hero" aria-labelledby="menu-title">
        <motion.div
          className="menu__copy"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.05 }}
        >
          <h1 id="menu-title">
            Slope <span>Invaders</span>
          </h1>
          <p>Graph the line. Blast the asteroids. Master y = mx + b.</p>
        </motion.div>

        <motion.div
          className="menu__hero-art"
          aria-hidden="true"
          variants={popIn}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.15 }}
        >
          <img src={uiShips.hero} alt="" draggable={false} />
          <span className="menu__hero-thruster" />
        </motion.div>
      </section>

      <motion.div variants={fadeInUp} initial="initial" animate="animate" transition={{ delay: 0.2 }}>
        <CoachPanel compact className="menu__coach">
          <strong>Cadet, your cannon follows the equation you build.</strong>
          <span>Choose a campaign route and keep the graph clear.</span>
        </CoachPanel>
      </motion.div>

      <section className="level-select" aria-labelledby="modes-title">
        <motion.div
          className="level-select__header"
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          transition={{ delay: 0.25 }}
        >
          <div>
            <span className="menu__panel-label">Game Modes</span>
            <h2 id="modes-title">Choose a Mode</h2>
          </div>
          <p>{availableCount} available now</p>
        </motion.div>

        <motion.div
          className="level-grid"
          variants={staggerContainer}
          initial="initial"
          animate="animate"
        >
          {modes.map((mode) => {
            const requiresCampaign = mode.id === 'arcade' && !arcadeUnlocked;
            const playable = mode.status === 'available' && !requiresCampaign;
            const status = playable
              ? 'Ready'
              : requiresCampaign
                ? 'Beat Campaign to Unlock'
                : 'Coming Soon';
            return (
              <motion.div key={mode.id} variants={staggerItem} style={{ display: 'contents' }}>
                <button
                  type="button"
                  className={`level-card ${playable ? 'level-card--selected' : ''}`}
                  disabled={!playable}
                  onClick={() => onSelectMode(mode.id)}
                >
                  <span className="level-card__number" aria-hidden>
                    {playable ? '01' : '—'}
                  </span>
                  <span className="level-card__body">
                    <strong>{mode.name}</strong>
                    <span>{mode.tagline}</span>
                  </span>
                  <span className={`level-card__status ${playable ? 'level-card__status--ready' : ''}`}>
                    {status}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {briefingOpen && (
        <Modal title="Mission Briefing" onClose={() => setBriefingOpen(false)}>
          <CoachPanel className="mission-briefing">
            <p>
              Adjust the equation until the aiming line passes through each asteroid&rsquo;s
              glowing core, then fire. Later missions add intercepts, direction, and other
              tactical controls.
            </p>
            <p>
              Use the on-screen controls, or the keyboard: <strong>R/F</strong> adjusts slope,
              <strong> W/S</strong> adjusts the y-intercept, and <strong>Space</strong> fires.
            </p>
            <p>
              Keyboard controls can be changed at any time from <strong>Settings → Change
              Controls</strong>.
            </p>
          </CoachPanel>
        </Modal>
      )}
    </main>
  );
}
