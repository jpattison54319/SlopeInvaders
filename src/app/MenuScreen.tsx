import { assets, icons } from '../assets/assetMap';
import { IconButton } from '../game/components/IconButton';
import type { LevelEntry } from '../game/levels';

interface MenuScreenProps {
  levels: LevelEntry[];
  selectedLevelId: string;
  onSelectLevel: (levelId: string) => void;
  onPlayLevel: (entry: LevelEntry) => void;
  onOpenSettings: () => void;
}

function statusText(entry: LevelEntry): string {
  return entry.status === 'available' ? 'Ready' : 'Coming Soon';
}

export function MenuScreen({
  levels,
  selectedLevelId,
  onSelectLevel,
  onPlayLevel,
  onOpenSettings,
}: MenuScreenProps) {
  const selectedLevel = levels.find((level) => level.id === selectedLevelId) ?? levels[0];
  const canPlaySelected = selectedLevel.status === 'available' && selectedLevel.config;

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
          <IconButton icon="trophy" label="Achievements" text="Stats" disabled />
          <IconButton icon="settings" label="Settings" text="Settings" onClick={onOpenSettings} />
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
              disabled={!canPlaySelected}
              onClick={() => onPlayLevel(selectedLevel)}
            >
              <img src={icons.play} alt="" draggable={false} />
              Play Level {selectedLevel.number}
            </button>
          </div>
        </div>

        <div className="menu__briefing" aria-label="Selected mission briefing">
          <span className="menu__panel-label">Mission Briefing</span>
          <h2>{selectedLevel.name}</h2>
          <p>{selectedLevel.learningGoal}</p>
          <dl>
            <div>
              <dt>Status</dt>
              <dd>{statusText(selectedLevel)}</dd>
            </div>
            <div>
              <dt>Focus</dt>
              <dd>{selectedLevel.subtitle}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="level-select" aria-labelledby="level-select-title">
        <div className="level-select__header">
          <div>
            <span className="menu__panel-label">Campaign</span>
            <h2 id="level-select-title">Level Select</h2>
          </div>
          <p>{levels.filter((level) => level.status === 'available').length} available now</p>
        </div>

        <div className="level-grid">
          {levels.map((entry) => {
            const selected = entry.id === selectedLevelId;
            const playable = entry.status === 'available' && entry.config;

            return (
              <button
                type="button"
                key={entry.id}
                className={`level-card ${selected ? 'level-card--selected' : ''}`}
                disabled={!playable}
                aria-pressed={selected}
                onClick={() => {
                  onSelectLevel(entry.id);
                }}
              >
                <span className="level-card__number">{entry.number}</span>
                <span className="level-card__body">
                  <strong>{entry.name}</strong>
                  <span>{entry.subtitle}</span>
                </span>
                <span className={`level-card__status ${playable ? 'level-card__status--ready' : ''}`}>
                  {statusText(entry)}
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </main>
  );
}
