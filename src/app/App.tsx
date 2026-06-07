import { useEffect, useState } from 'react';
import { music } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import { SfxProvider } from '../game/audio/sfx';
import { Game } from '../game/Game';
import { modes, type GameModeId } from '../game/modes';
import {
  zones,
  findZone,
  findCampaignLevel,
  nextLevel,
  firstCampaignLevel,
} from '../game/campaign/zones';
import { MenuScreen } from './MenuScreen';
import { CampaignMapScreen } from './CampaignMapScreen';
import { ZoneLevelsScreen } from './ZoneLevelsScreen';
import { DebriefScreen } from './DebriefScreen';
import { SettingsModal } from './SettingsModal';
import { usePersistentState } from './usePersistentState';
import { useCampaignProgress } from './useCampaignProgress';

type Screen =
  | { name: 'mode-select' }
  | { name: 'campaign-map' }
  | { name: 'zone-levels'; zoneId: string }
  | { name: 'game'; levelId: string }
  | { name: 'debrief'; zoneId: string };

const DEFAULT_MUSIC_VOLUME = 0.65;
const DEFAULT_SFX_VOLUME = 0.7;

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: 'mode-select' });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [musicVolume, setMusicVolume] = usePersistentState('slope-invaders:music-volume', DEFAULT_MUSIC_VOLUME);
  const [musicMuted, setMusicMuted] = usePersistentState('slope-invaders:music-muted', false);
  const [sfxVolume, setSfxVolume] = usePersistentState('slope-invaders:sfx-volume', DEFAULT_SFX_VOLUME);
  const [sfxMuted, setSfxMuted] = usePersistentState('slope-invaders:sfx-muted', false);

  const progress = useCampaignProgress();

  useMusic(screen.name === 'game' ? music.game : music.menu, musicVolume, musicMuted);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  const openSettings = () => setSettingsOpen(true);

  const selectMode = (id: GameModeId) => {
    if (id === 'campaign') setScreen({ name: 'campaign-map' });
    // Arcade / Versus are coming soon — no-op for now.
  };

  const advance = (levelId: string) => {
    const next = nextLevel(levelId);
    if (next) {
      setScreen({ name: 'game', levelId: next.level.id });
      return;
    }
    const current = findCampaignLevel(levelId);
    if (current?.zone.debrief) {
      setScreen({ name: 'debrief', zoneId: current.zone.id });
    } else {
      setScreen({ name: 'campaign-map' });
    }
  };

  const exitToZone = (levelId: string) => {
    const current = findCampaignLevel(levelId);
    setScreen(
      current ? { name: 'zone-levels', zoneId: current.zone.id } : { name: 'campaign-map' },
    );
  };

  function renderScreen() {
    switch (screen.name) {
      case 'mode-select':
        return <MenuScreen modes={modes} onSelectMode={selectMode} onOpenSettings={openSettings} />;

      case 'campaign-map':
        return (
          <CampaignMapScreen
            zones={zones}
            progress={progress}
            onSelectZone={(zoneId) => setScreen({ name: 'zone-levels', zoneId })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
          />
        );

      case 'zone-levels': {
        const zone = findZone(screen.zoneId);
        if (!zone) return null;
        return (
          <ZoneLevelsScreen
            zone={zone}
            progress={progress}
            onSelectLevel={(levelId) => setScreen({ name: 'game', levelId })}
            onBack={() => setScreen({ name: 'campaign-map' })}
            onOpenSettings={openSettings}
          />
        );
      }

      case 'debrief': {
        const zone = findZone(screen.zoneId);
        if (!zone) return null;
        return (
          <DebriefScreen
            zone={zone}
            onBack={() => setScreen({ name: 'campaign-map' })}
            onOpenSettings={openSettings}
          />
        );
      }

      case 'game': {
        const ctx = findCampaignLevel(screen.levelId) ?? findCampaignLevel(firstCampaignLevel.level.id)!;
        const { zone, level, index } = ctx;
        const label =
          zone.number === 0 ? 'Tutorial' : `Zone ${zone.number} · Level ${index + 1}`;
        return (
          <Game
            key={level.id}
            level={level.config}
            title={level.name}
            levelNumberLabel={label}
            hasNext={!!nextLevel(level.id)}
            onExit={() => exitToZone(level.id)}
            onSettings={openSettings}
            onAdvance={() => advance(level.id)}
            onComplete={progress.markComplete}
          />
        );
      }

      default:
        return null;
    }
  }

  return (
    <SfxProvider volume={sfxVolume} muted={sfxMuted}>
      {renderScreen()}

      {settingsOpen && (
        <SettingsModal
          musicVolume={musicVolume}
          musicMuted={musicMuted}
          sfxVolume={sfxVolume}
          sfxMuted={sfxMuted}
          activeTrack={screen.name === 'game' ? 'game' : 'menu'}
          onChangeMusicVolume={setMusicVolume}
          onChangeMusicMuted={setMusicMuted}
          onChangeSfxVolume={setSfxVolume}
          onChangeSfxMuted={setSfxMuted}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </SfxProvider>
  );
}
