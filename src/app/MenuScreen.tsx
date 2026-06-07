import { assets, icons } from '../assets/assetMap';
import { IconButton } from '../game/components/IconButton';
import type { GameModeId, ModeDescriptor } from '../game/modes';

interface MenuScreenProps {
  modes: ModeDescriptor[];
  onSelectMode: (id: GameModeId) => void;
  onOpenSettings: () => void;
}

/** The landing screen: title, how-to, and the game-mode selector. */
export function MenuScreen({ modes, onSelectMode, onOpenSettings }: MenuScreenProps) {
  const campaign = modes.find((m) => m.id === 'campaign');
  const campaignReady = campaign?.status === 'available';
  const availableCount = modes.filter((m) => m.status === 'available').length;

  return (
    <main
      className="menu"
      style={{
        backgroundImage: `linear-gradient(rgba(5, 8, 24, 0.42), rgba(5, 8, 24, 0.82)), url(${assets.starfield})`,
      }}
    >
      <nav className="menu__topbar" aria-label="Main menu">
        <div className="menu__brand">
          <img src={assets.ship} alt="" draggable={false} />
          <span>Slope Invaders</span>
        </div>
        <div className="menu__actions">
          <IconButton icon="trophy" label="Achievements" className="chrome-icon-btn" disabled />
          <IconButton icon="settings" label="Settings" className="chrome-icon-btn" onClick={onOpenSettings} />
        </div>
      </nav>

      <section className="menu__hero" aria-labelledby="menu-title">
        <div className="menu__copy">
          <h1 id="menu-title">
            Slope <span>Invaders</span>
          </h1>
          <p>Graph the line. Blast the asteroids. Master y = mx + b.</p>
          <div className="menu__cta-row">
            <button
              type="button"
              className="menu__play"
              disabled={!campaignReady}
              onClick={() => onSelectMode('campaign')}
            >
              <img src={icons.play} alt="" draggable={false} />
              Play Campaign
            </button>
          </div>
        </div>

        <div className="menu__briefing" aria-label="How to play">
          <span className="menu__panel-label">How to Play</span>
          <h2>Aim with slope</h2>
          <p>
            Set your slope (and later, the y-intercept) so the dashed line passes through each
            asteroid&rsquo;s glowing core, then Fire. Clear every asteroid to advance — but watch
            your hearts!
          </p>
        </div>
      </section>

      <section className="level-select" aria-labelledby="modes-title">
        <div className="level-select__header">
          <div>
            <span className="menu__panel-label">Game Modes</span>
            <h2 id="modes-title">Choose a Mode</h2>
          </div>
          <p>{availableCount} available now</p>
        </div>

        <div className="level-grid">
          {modes.map((mode) => {
            const playable = mode.status === 'available';
            return (
              <button
                type="button"
                key={mode.id}
                className={`level-card ${playable ? 'level-card--selected' : ''}`}
                disabled={!playable}
                onClick={() => onSelectMode(mode.id)}
              >
                <span className="level-card__number" aria-hidden>
                  {playable ? '▶' : '🔒'}
                </span>
                <span className="level-card__body">
                  <strong>{mode.name}</strong>
                  <span>{mode.tagline}</span>
                </span>
                <span className={`level-card__status ${playable ? 'level-card__status--ready' : ''}`}>
                  {playable ? 'Ready' : 'Coming Soon'}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
