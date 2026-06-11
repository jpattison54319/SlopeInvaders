import { useEffect, useState } from 'react';
import { music } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import { SfxProvider } from '../game/audio/sfx';
import { useButtonClickSfx } from '../game/audio/buttonClick';
import { Game } from '../game/Game';
import { modes, type GameModeId } from '../game/modes';
import {
  zones,
  findZone,
  findCampaignLevel,
  nextLevelInZone,
  firstCampaignLevel,
} from '../game/campaign/zones';
import { configForTier } from '../game/campaign/difficulty';
import { planetSrcForZone } from '../game/campaign/planets';
import { MenuScreen } from './MenuScreen';
import { GalaxyMapScreen } from './galaxy/GalaxyMapScreen';
import { LaunchTransition } from './LaunchTransition';
import { MissionFadeTransition } from './MissionFadeTransition';
import { CampaignMapScreen } from './CampaignMapScreen';
import { ZoneLevelsScreen } from './ZoneLevelsScreen';
import { DebriefScreen } from './DebriefScreen';
import { CampaignCompleteScreen } from './CampaignCompleteScreen';
import { PilotProfileScreen } from './PilotProfileScreen';
import { ClassroomScreen } from './ClassroomScreen';
import { TeacherDashboardScreen } from './TeacherDashboardScreen';
import { VersusLobbyScreen } from './VersusLobbyScreen';
import { VersusMatchScreen } from './VersusMatchScreen';
import { getCadetName } from '../cloud/identity';
import type { MatchRole } from '../game/versus/types';
import { SettingsModal } from './SettingsModal';
import { usePersistentState } from './usePersistentState';
import { DEFAULT_KEYBINDINGS, KEYBINDINGS_KEY, withDefaults } from '../game/controls/keybindings';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useCampaignProgress } from './useCampaignProgress';
import { ArcadeBriefingScreen } from './ArcadeBriefingScreen';
import { ArcadeGame } from '../game/arcade/ArcadeGame';
import { useArcadeRecords } from '../game/arcade/useArcadeRecords';

type Screen =
  | { name: 'mode-select' }
  | { name: 'galaxy'; zoneId?: string }
  | { name: 'launch'; levelId: string }
  | { name: 'fade'; levelId: string }
  | { name: 'campaign-map' }
  | { name: 'zone-levels'; zoneId: string }
  | { name: 'game'; levelId: string }
  | { name: 'debrief'; zoneId: string }
  | { name: 'campaign-complete' }
  | { name: 'pilot-profile'; from: 'mode-select' | 'galaxy' | 'campaign-map' }
  | { name: 'classroom'; joinCode?: string }
  | { name: 'teacher-dashboard'; teacherKey?: string }
  | { name: 'versus' }
  | { name: 'arcade-briefing' }
  | { name: 'arcade-game' }
  | {
      name: 'versus-match';
      matchId: string;
      seed: number;
      role: MatchRole;
      opponentStudentId: string | null;
    };

/** The last available zone — clearing its debrief completes the campaign. */
const lastAvailableZoneId = zones.filter((z) => z.status === 'available').at(-1)?.id;

/** Open straight to the classroom/teacher screen when a capability link is used. */
function initialScreen(): Screen {
  try {
    const params = new URLSearchParams(window.location.search);
    const teacher = params.get('teacher');
    if (teacher) return { name: 'teacher-dashboard', teacherKey: teacher };
    const cls = params.get('class');
    if (cls) return { name: 'classroom', joinCode: cls.toUpperCase() };
  } catch {
    /* ignore malformed URLs */
  }
  return { name: 'mode-select' };
}

const DEFAULT_MUSIC_VOLUME = 0.65;
const DEFAULT_SFX_VOLUME = 0.7;

function ButtonClickSfx() {
  useButtonClickSfx();
  return null;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [musicVolume, setMusicVolume] = usePersistentState('slope-invaders:music-volume', DEFAULT_MUSIC_VOLUME);
  const [musicMuted, setMusicMuted] = usePersistentState('slope-invaders:music-muted', false);
  const [sfxVolume, setSfxVolume] = usePersistentState('slope-invaders:sfx-volume', DEFAULT_SFX_VOLUME);
  const [sfxMuted, setSfxMuted] = usePersistentState('slope-invaders:sfx-muted', false);
  const [storedKeyBindings, setKeyBindings] = usePersistentState(KEYBINDINGS_KEY, DEFAULT_KEYBINDINGS);
  // Merge over defaults so a stored map that predates a new action stays valid.
  const keyBindings = withDefaults(storedKeyBindings);

  const progress = useCampaignProgress();
  const arcade = useArcadeRecords();
  const reducedMotion = usePrefersReducedMotion();
  const campaignComplete = zones
    .filter((zone) => zone.status === 'available')
    .every((zone) => progress.isZoneComplete(zone.id));

  const inGame =
    screen.name === 'game' || screen.name === 'versus-match' || screen.name === 'arcade-game';
  useMusic(inGame ? music.game : music.menu, musicVolume, musicMuted);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  const openSettings = () => setSettingsOpen(true);

  const selectMode = (id: GameModeId) => {
    if (id === 'campaign') setScreen({ name: 'galaxy' });
    else if (id === 'versus') setScreen({ name: 'versus' });
    else if (id === 'arcade' && campaignComplete) setScreen({ name: 'arcade-briefing' });
  };

  const advance = (levelId: string) => {
    // Advance within the current zone only — never auto-cross into the next zone.
    const next = nextLevelInZone(levelId);
    if (next) {
      setScreen({ name: 'game', levelId: next.level.id });
      return;
    }
    // Finished a zone's last level: run the end-of-zone self-regulated learning
    // check (reflections + debrief) if it has one, otherwise back to the galaxy.
    const current = findCampaignLevel(levelId);
    const hasLearningCheck =
      !!current?.zone.debrief || !!current?.zone.reflections?.length;
    if (hasLearningCheck) {
      setScreen({ name: 'debrief', zoneId: current!.zone.id });
    } else {
      setScreen({ name: 'galaxy', zoneId: current?.zone.id });
    }
  };

  const exitToZone = (levelId: string) => {
    const current = findCampaignLevel(levelId);
    setScreen({ name: 'galaxy', zoneId: current?.zone.id });
  };

  function renderScreen() {
    switch (screen.name) {
      case 'mode-select':
        return (
          <MenuScreen
            modes={modes}
            arcadeUnlocked={campaignComplete}
            onSelectMode={selectMode}
            onOpenSettings={openSettings}
            onOpenProfile={() => setScreen({ name: 'pilot-profile', from: 'mode-select' })}
            onOpenClassroom={() => setScreen({ name: 'classroom' })}
          />
        );

      case 'galaxy':
        return (
          <GalaxyMapScreen
            zones={zones}
            progress={progress}
            initialZoneId={screen.zoneId}
            onPlayLevel={(levelId) => setScreen({ name: 'fade', levelId })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
            onToggleView={() => setScreen({ name: 'campaign-map' })}
            toggleViewIcon="list"
            onOpenProfile={() => setScreen({ name: 'pilot-profile', from: 'galaxy' })}
          />
        );

      case 'launch': {
        const ctx = findCampaignLevel(screen.levelId);
        const planetSrc = ctx ? planetSrcForZone(ctx.zone.id) : '';
        return (
          <LaunchTransition
            planetSrc={planetSrc}
            reducedMotion={reducedMotion}
            onDone={() => setScreen({ name: 'game', levelId: screen.levelId })}
          />
        );
      }

      case 'fade':
        return (
          <MissionFadeTransition
            reducedMotion={reducedMotion}
            onDone={() => setScreen({ name: 'game', levelId: screen.levelId })}
          />
        );

      case 'campaign-map':
        return (
          <CampaignMapScreen
            zones={zones}
            progress={progress}
            onSelectZone={(zoneId) => setScreen({ name: 'zone-levels', zoneId })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
            onToggleView={() => setScreen({ name: 'galaxy' })}
            toggleViewIcon="planet"
            onOpenProfile={() => setScreen({ name: 'pilot-profile', from: 'campaign-map' })}
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
            onToggleView={() => setScreen({ name: 'galaxy', zoneId: zone.id })}
            toggleViewIcon="planet"
          />
        );
      }

      case 'debrief': {
        const zone = findZone(screen.zoneId);
        if (!zone) return null;
        // After the final zone's debrief, run the campaign finale; otherwise
        // return to the galaxy.
        const isFinalZone = zone.id === lastAvailableZoneId;
        return (
          <DebriefScreen
            zone={zone}
            onBack={() =>
              setScreen(isFinalZone ? { name: 'campaign-complete' } : { name: 'galaxy', zoneId: zone.id })
            }
            onOpenSettings={openSettings}
          />
        );
      }

      case 'pilot-profile': {
        const from = screen.from;
        const returnToProfileSource = () => {
          if (from === 'mode-select') {
            setScreen({ name: 'mode-select' });
          } else if (from === 'galaxy') {
            setScreen({ name: 'galaxy' });
          } else {
            setScreen({ name: 'campaign-map' });
          }
        };

        return (
          <PilotProfileScreen
            progress={progress}
            arcadeRecords={arcade.records}
            backLabel={from === 'mode-select' ? 'Menu' : from === 'galaxy' ? 'Galaxy' : 'Zones'}
            onBack={returnToProfileSource}
            onOpenSettings={openSettings}
          />
        );
      }

      case 'classroom':
        return (
          <ClassroomScreen
            progress={progress}
            initialJoinCode={screen.joinCode}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
            onOpenTeacher={() => setScreen({ name: 'teacher-dashboard' })}
          />
        );

      case 'teacher-dashboard':
        return (
          <TeacherDashboardScreen
            initialTeacherKey={screen.teacherKey}
            onBack={() => setScreen({ name: 'classroom' })}
            onOpenSettings={openSettings}
          />
        );

      case 'versus':
        return (
          <VersusLobbyScreen
            onStartMatch={(p) => setScreen({ name: 'versus-match', ...p })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
            onOpenClassroom={() => setScreen({ name: 'classroom' })}
          />
        );

      case 'arcade-briefing':
        return (
          <ArcadeBriefingScreen
            records={arcade.records}
            onStart={() => setScreen({ name: 'arcade-game' })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
          />
        );

      case 'arcade-game':
        return (
          <ArcadeGame
            records={arcade.records}
            keyBindings={keyBindings}
            keyboardEnabled={!settingsOpen}
            externallyPaused={settingsOpen}
            reducedMotion={reducedMotion}
            onOpenSettings={openSettings}
            onRecordRun={arcade.recordRun}
            onExit={() => setScreen({ name: 'mode-select' })}
          />
        );

      case 'versus-match':
        return (
          <VersusMatchScreen
            matchId={screen.matchId}
            seed={screen.seed}
            role={screen.role}
            opponentStudentId={screen.opponentStudentId}
            myName={getCadetName()}
            onExit={() => setScreen({ name: 'versus' })}
          />
        );

      case 'campaign-complete':
        return (
          <CampaignCompleteScreen
            progress={progress}
            reducedMotion={reducedMotion}
            onMenu={() => setScreen({ name: 'mode-select' })}
            onGalaxy={() => setScreen({ name: 'galaxy', zoneId: lastAvailableZoneId })}
            onOpenSettings={openSettings}
          />
        );

      case 'game': {
        const ctx = findCampaignLevel(screen.levelId) ?? findCampaignLevel(firstCampaignLevel.level.id)!;
        const { zone, level, index } = ctx;
        const label =
          zone.number === 0 ? 'Tutorial' : `Zone ${zone.number} · Level ${index + 1}`;
        // Rolling adaptivity: pick the tier from prior performance, then derive
        // the playable config (hearts/scaffolds/variants) for that tier.
        const tier = progress.tierForLevel(zone, index);
        return (
          <Game
            key={level.id}
            level={configForTier(level, tier)}
            tier={tier}
            title={level.name}
            levelNumberLabel={label}
            hasNext={!!nextLevelInZone(level.id)}
            keyBindings={keyBindings}
            keyboardEnabled={!settingsOpen}
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
      <ButtonClickSfx />
      {renderScreen()}

      {settingsOpen && (
        <SettingsModal
          musicVolume={musicVolume}
          musicMuted={musicMuted}
          sfxVolume={sfxVolume}
          sfxMuted={sfxMuted}
          activeTrack={inGame ? 'game' : 'menu'}
          keyBindings={keyBindings}
          onChangeMusicVolume={setMusicVolume}
          onChangeMusicMuted={setMusicMuted}
          onChangeSfxVolume={setSfxVolume}
          onChangeSfxMuted={setSfxMuted}
          onChangeKeyBindings={setKeyBindings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

    </SfxProvider>
  );
}
