import { useEffect, useMemo, useState } from 'react';
import { music } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import { Game } from '../game/Game';
import { levels, type LevelEntry } from '../game/levels';
import { MenuScreen } from './MenuScreen';
import { SettingsModal } from './SettingsModal';

type Screen =
  | { name: 'menu' }
  | {
      name: 'game';
      levelId: string;
    };

const DEFAULT_VOLUME = 0.65;

function firstPlayableLevel(): LevelEntry {
  const playable = levels.find((level) => level.status === 'available' && level.config);
  if (!playable) {
    throw new Error('Slope Invaders needs at least one playable level.');
  }
  return playable;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'menu' });
  const [selectedLevelId, setSelectedLevelId] = useState(() => firstPlayableLevel().id);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [muted, setMuted] = useState(false);

  const selectedLevel = useMemo(
    () => levels.find((level) => level.id === selectedLevelId) ?? firstPlayableLevel(),
    [selectedLevelId],
  );

  const activeGameLevel =
    screen.name === 'game'
      ? levels.find((level) => level.id === screen.levelId && level.status === 'available' && level.config) ??
        firstPlayableLevel()
      : null;

  useMusic(screen.name === 'game' ? music.game : music.menu, volume, muted);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  const playLevel = (entry: LevelEntry) => {
    if (entry.status !== 'available' || !entry.config) return;
    setSelectedLevelId(entry.id);
    setScreen({ name: 'game', levelId: entry.id });
  };

  return (
    <>
      {screen.name === 'menu' ? (
        <MenuScreen
          levels={levels}
          selectedLevelId={selectedLevel.id}
          onSelectLevel={setSelectedLevelId}
          onPlayLevel={playLevel}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        activeGameLevel && (
          <Game
            entry={activeGameLevel}
            onExit={() => setScreen({ name: 'menu' })}
            onSettings={() => setSettingsOpen(true)}
          />
        )
      )}

      {settingsOpen && (
        <SettingsModal
          volume={volume}
          muted={muted}
          activeTrack={screen.name === 'game' ? 'game' : 'menu'}
          onChangeVolume={setVolume}
          onChangeMuted={setMuted}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </>
  );
}
