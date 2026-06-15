import { useEffect, useState } from 'react';
import { assets, uiBackgrounds, uiButtons, uiShips, type UiButtonKey } from '../assets/assetMap';
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
  const modeDetails = {
    campaign: {
      asset: 'planet',
      label: 'Story Route',
      detail: 'Zone map, guided missions, mastery stars',
    },
    arcade: {
      asset: 'play',
      label: 'Score Run',
      detail: arcadeUnlocked ? 'Endless waves and personal records' : 'Unlocks after Zone 2',
    },
    versus: {
      asset: 'trophy',
      label: 'Head-to-Head',
      detail: 'Classroom duels, pickups, live boards',
    },
  } satisfies Record<
    GameModeId,
    {
      asset: UiButtonKey;
      label: string;
      detail: string;
    }
  >;
  const supportActions = [
    {
      asset: 'info',
      label: 'Mission briefing',
      title: 'Briefing',
      description: 'Review the mission rules and keyboard controls.',
      onClick: () => setBriefingOpen(true),
    },
    {
      asset: 'hangar',
      label: 'Hangar',
      title: 'Hangar',
      description: 'Equip ship hulls, trails, and cockpit themes.',
      onClick: onOpenHangar,
    },
    {
      asset: 'classroom',
      label: 'Classroom',
      title: 'Classroom',
      description: 'Join your squadron or connect with teacher missions.',
      onClick: onOpenClassroom,
    },
  ] satisfies Array<{
    asset: UiButtonKey;
    label: string;
    title: string;
    description: string;
    onClick: () => void;
  }>;

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
          <TacticalButton asset="profile" label="Pilot Profile" text="Profile" size="small" onClick={onOpenProfile} />
          <TacticalButton asset="settings" label="Settings" text="Settings" size="small" onClick={onOpenSettings} />
        </div>
      </nav>

      <section className="menu__hero" aria-labelledby="menu-title">
        <div className="menu__copy">
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
            <h2 id="modes-title">Choose a Mode</h2>
          </div>
          <p>{availableCount} available now</p>
        </div>

        <div className="level-grid">
          {modes.map((mode, i) => {
            const requiresArcadeUnlock = mode.id === 'arcade' && !arcadeUnlocked;
            const playable = mode.status === 'available' && !requiresArcadeUnlock;
            const details = modeDetails[mode.id];
            const status = playable
              ? 'Ready'
              : requiresArcadeUnlock
                ? 'Complete Zone 2 to Unlock'
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
                <span className="level-card__icon" aria-hidden="true">
                  <img
                    className="level-card__icon-image level-card__icon-image--default"
                    src={uiButtons[details.asset].default}
                    alt=""
                    draggable={false}
                  />
                  <img
                    className="level-card__icon-image level-card__icon-image--active"
                    src={uiButtons[details.asset].active}
                    alt=""
                    draggable={false}
                  />
                </span>
                <span className="level-card__body">
                  <span className="level-card__type">{details.label}</span>
                  <strong>{mode.name}</strong>
                  <span>{mode.tagline}</span>
                  <span className="level-card__description">{details.detail}</span>
                </span>
                <span className="level-card__footer">
                  <span className={`level-card__status ${playable ? 'level-card__status--ready' : ''}`}>
                    {status}
                  </span>
                  <span className={`level-card__cta ${playable ? 'level-card__cta--ready' : ''}`}>
                    {playable ? 'Launch' : 'Locked'}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="support-select" aria-labelledby="support-title">
        <div className="support-select__header">
          <div>
            <h2 id="support-title">Tools &amp; Support</h2>
          </div>
        </div>

        <div className="menu-support" aria-label="Tools and support">
          {supportActions.map((action, i) => (
            <button
              type="button"
              key={action.label}
              className="menu-support__card"
              aria-label={action.label}
              onClick={action.onClick}
              style={{ animationDelay: `${780 + i * 100}ms` }}
            >
              <span className="menu-support__icon" aria-hidden="true">
                <span className="tactical-button tactical-button--small tactical-button--icon">
                  <span className="tactical-button__art">
                    <img
                      className="tactical-button__image tactical-button__image--default"
                      src={uiButtons[action.asset].default}
                      alt=""
                      draggable={false}
                    />
                    <img
                      className="tactical-button__image tactical-button__image--active"
                      src={uiButtons[action.asset].active}
                      alt=""
                      draggable={false}
                    />
                  </span>
                </span>
              </span>
              <span className="menu-support__body">
                <strong>{action.title}</strong>
                <span>{action.description}</span>
              </span>
            </button>
          ))}
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
