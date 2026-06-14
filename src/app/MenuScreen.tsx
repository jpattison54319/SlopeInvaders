import { useEffect, useState } from 'react';
import { assets, uiBackgrounds, uiShips } from '../assets/assetMap';
import { CoachPanel } from '../game/components/CoachPanel';
import { Modal } from '../game/components/Modal';
import { TacticalButton } from '../game/components/TacticalButton';
import type { GameModeId, ModeDescriptor } from '../game/modes';

interface MenuScreenProps {
  modes: ModeDescriptor[];
  arcadeUnlocked: boolean;
  animateEntrance?: boolean;
  onEntrancePlayed?: () => void;
  onSelectMode: (id: GameModeId) => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
  onOpenClassroom: () => void;
  onOpenHangar: () => void;
}

/** The landing screen: title, how-to, and the game-mode selector. */
export function MenuScreen({
  modes,
  arcadeUnlocked,
  animateEntrance = true,
  onEntrancePlayed,
  onSelectMode,
  onOpenSettings,
  onOpenProfile,
  onOpenClassroom,
  onOpenHangar,
}: MenuScreenProps) {
  const [briefingOpen, setBriefingOpen] = useState(false);
  const [shouldAnimate] = useState(animateEntrance);
  const [loaded, setLoaded] = useState(!shouldAnimate);
  const availableCount = modes.filter(
    (mode) => mode.status === 'available' && (mode.id !== 'arcade' || arcadeUnlocked),
  ).length;

  useEffect(() => {
    if (!shouldAnimate) return;
    onEntrancePlayed?.();
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, [shouldAnimate, onEntrancePlayed]);

  return (
    <main
      className={`menu menu--tactical${shouldAnimate ? ' menu--animate' : ''}${
        loaded ? ' menu--loaded' : ''
      }`}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(4, 8, 24, 0.34), rgba(4, 8, 24, 0.84)), url(${uiBackgrounds.menu})`,
      }}
    >
      <nav className="menu__topbar" aria-label="Main menu">
        <div className="menu__brand">
          <img src={assets.ship} alt="" draggable={false} />
        </div>
        <div className="menu__actions">
          <TacticalButton asset="info" label="Mission briefing" text="Briefing" size="small" onClick={() => setBriefingOpen(true)} />
          <TacticalButton asset="trophy" label="Hangar" text="Hangar" size="small" onClick={onOpenHangar} />
          <TacticalButton asset="hangar" label="Classroom" text="Classroom" size="small" onClick={onOpenClassroom} />
          <TacticalButton asset="profile" label="Pilot Profile" text="Profile" size="small" onClick={onOpenProfile} />
          <TacticalButton asset="settings" label="Settings" text="Settings" size="small" onClick={onOpenSettings} />
        </div>
      </nav>

      <section className="menu__hero" aria-labelledby="menu-title">
        <div className="menu__copy">
          <span className="menu__kicker">Equation Defense Command</span>
          <h1 id="menu-title" className="menu__title" aria-label="Slope Invaders">
            <span className="visually-hidden">Slope Invaders</span>
            <span className="menu__title-word" aria-hidden>
              {'Slope'.split('').map((char, i) => (
                <span
                  key={i}
                  className="menu__title-letter"
                  style={{ animationDelay: `${1800 + i * 100}ms` }}
                >
                  {char}
                </span>
              ))}
            </span>{' '}
            <span className="menu__title-word menu__title-word--amber" aria-hidden>
              {'Invaders'.split('').map((char, i) => (
                <span
                  key={i}
                  className="menu__title-letter"
                  style={{ animationDelay: `${1800 + (6 + i) * 100}ms` }}
                >
                  {char}
                </span>
              ))}
            </span>
          </h1>
          <p>Graph the line. Blast the asteroids. Master y = mx + b.</p>
        </div>

        <div className="menu__hero-art" aria-hidden="true">
          <img src={uiShips.hero} alt="" draggable={false} />
          <span className="menu__hero-thruster" />
        </div>
      </section>

      <CoachPanel compact className="menu__coach">
        <strong>Cadet, your cannon follows the equation you build.</strong>
        <span>Choose a campaign route and keep the graph clear.</span>
      </CoachPanel>

      <section className="level-select" aria-labelledby="modes-title">
        <div className="level-select__header">
          <div>
            <span className="menu__panel-label">Game Modes</span>
            <h2 id="modes-title">Choose a Mode</h2>
          </div>
          <p>{availableCount} available now</p>
        </div>

        <div className="level-grid">
          {modes.map((mode, i) => {
            const requiresCampaign = mode.id === 'arcade' && !arcadeUnlocked;
            const playable = mode.status === 'available' && !requiresCampaign;
            const status = playable
              ? 'Ready'
              : requiresCampaign
                ? 'Beat Campaign to Unlock'
                : 'Coming Soon';
            return (
              <button
                type="button"
                key={mode.id}
                className={`level-card ${playable ? 'level-card--selected' : ''}`}
                disabled={!playable}
                onClick={() => onSelectMode(mode.id)}
                style={{ animationDelay: `${460 + i * 100}ms` }}
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
            );
          })}
        </div>
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
