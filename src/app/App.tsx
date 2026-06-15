import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { music } from '../assets/assetMap';
import { useMusic } from '../game/audio/useMusic';
import { SfxProvider } from '../game/audio/sfx';
import { useButtonClickSfx } from '../game/audio/buttonClick';
import { modes, type GameModeId } from '../game/modes';
import {
  zones,
  ARCADE_UNLOCK_ZONE_ID,
  findZone,
  findCampaignLevel,
  nextLevelInZone,
  firstCampaignLevel,
} from '../game/campaign/zones';
import { configForTier } from '../game/campaign/difficulty';
import { planetSrcForZone } from '../game/campaign/planets';
import { MenuScreen } from './MenuScreen';
import { LaunchTransition } from './LaunchTransition';
import { MissionFadeTransition } from './MissionFadeTransition';
import { getCadetName } from '../cloud/identity';
import type { MatchRole } from '../game/versus/types';
import { SettingsModal } from './SettingsModal';
import { usePersistentState } from './usePersistentState';
import { DEFAULT_KEYBINDINGS, KEYBINDINGS_KEY, withDefaults } from '../game/controls/keybindings';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useCampaignProgress } from './useCampaignProgress';
import { useLoadout } from './useLoadout';
import { useArcadeRecords } from '../game/arcade/useArcadeRecords';
import { computeArcadeXp } from '../game/arcade/scoring';
import { SkipLink } from './SkipLink';
import { KeyboardShortcutsHelp } from './KeyboardShortcutsHelp';

// --- Lazy-loaded screens (improvement #6: code splitting) ---
// The campaign gameplay, arcade, versus, and cloud screens pull in Konva, the
// Supabase client, or large pedagogical data — only load them when needed.
const Game = lazy(() => import('../game/Game').then((m) => ({ default: m.Game })));
const ArcadeGame = lazy(() =>
  import('../game/arcade/ArcadeGame').then((m) => ({ default: m.ArcadeGame })),
);
const GalaxyMapScreen = lazy(() =>
  import('./galaxy/GalaxyMapScreen').then((m) => ({ default: m.GalaxyMapScreen })),
);
const CampaignMapScreen = lazy(() =>
  import('./CampaignMapScreen').then((m) => ({ default: m.CampaignMapScreen })),
);
const ZoneLevelsScreen = lazy(() =>
  import('./ZoneLevelsScreen').then((m) => ({ default: m.ZoneLevelsScreen })),
);
const DebriefScreen = lazy(() =>
  import('./DebriefScreen').then((m) => ({ default: m.DebriefScreen })),
);
const CampaignCompleteScreen = lazy(() =>
  import('./CampaignCompleteScreen').then((m) => ({ default: m.CampaignCompleteScreen })),
);
const PilotProfileScreen = lazy(() =>
  import('./PilotProfileScreen').then((m) => ({ default: m.PilotProfileScreen })),
);
const HangarScreen = lazy(() =>
  import('./HangarScreen').then((m) => ({ default: m.HangarScreen })),
);
const ClassroomScreen = lazy(() =>
  import('./ClassroomScreen').then((m) => ({ default: m.ClassroomScreen })),
);
const TeacherDashboardScreen = lazy(() =>
  import('./TeacherDashboardScreen').then((m) => ({ default: m.TeacherDashboardScreen })),
);
const VersusLobbyScreen = lazy(() =>
  import('./VersusLobbyScreen').then((m) => ({ default: m.VersusLobbyScreen })),
);
const VersusMatchScreen = lazy(() =>
  import('./VersusMatchScreen').then((m) => ({ default: m.VersusMatchScreen })),
);
const ArcadeBriefingScreen = lazy(() =>
  import('./ArcadeBriefingScreen').then((m) => ({ default: m.ArcadeBriefingScreen })),
);

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
  | { name: 'hangar'; back: Screen }
  | { name: 'classroom'; joinCode?: string }
  | { name: 'teacher-dashboard'; teacherKey?: string }
  | { name: 'versus' }
  | { name: 'arcade-briefing' }
  | { name: 'arcade-game'; noPreview?: boolean }
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [menuEntrancePlayed, setMenuEntrancePlayed] = useState(false);
  const markMenuEntrancePlayed = useCallback(() => {
    setMenuEntrancePlayed(true);
  }, []);

  const [musicVolume, setMusicVolume] = usePersistentState('slope-invaders:music-volume', DEFAULT_MUSIC_VOLUME);
  const [musicMuted, setMusicMuted] = usePersistentState('slope-invaders:music-muted', false);
  const [sfxVolume, setSfxVolume] = usePersistentState('slope-invaders:sfx-volume', DEFAULT_SFX_VOLUME);
  const [sfxMuted, setSfxMuted] = usePersistentState('slope-invaders:sfx-muted', false);
  const [storedKeyBindings, setKeyBindings] = usePersistentState(KEYBINDINGS_KEY, DEFAULT_KEYBINDINGS);
  // Merge over defaults so a stored map that predates a new action stays valid.
  const keyBindings = withDefaults(storedKeyBindings);

  const progress = useCampaignProgress();
  const loadout = useLoadout();
  const arcade = useArcadeRecords();
  const reducedMotion = usePrefersReducedMotion();

  // Apply the equipped theme's palette to the whole app by overriding the CSS
  // accent/background custom properties on :root. Purely cosmetic.
  const theme = loadout.equipped.theme;
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cyan', theme.accent);
    root.style.setProperty('--amber', theme.amber);
    root.style.setProperty('--space-0', theme.gradient[0]);
    root.style.setProperty('--space-1', theme.gradient[1]);
  }, [theme]);
  const arcadeUnlocked = progress.isZoneComplete(ARCADE_UNLOCK_ZONE_ID);

  const inGame =
    screen.name === 'game' || screen.name === 'versus-match' || screen.name === 'arcade-game';
  useMusic(inGame ? music.game : music.menu, musicVolume, musicMuted);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [screen]);

  // Improvement #8: universal keyboard shortcuts.
  // - `?` (Shift+/) toggles the in-app shortcuts panel from anywhere outside
  //   a focused input. Skipped while the user is typing in the calculator.
  // - `S` opens Settings and `P` opens the Pilot Profile, but never during
  //   gameplay (letters can be gameplay bindings — default S lowers the
  //   y-intercept), never with a modifier held, and never while a dialog is
  //   already open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?') {
        e.preventDefault();
        setShortcutsOpen((open) => !open);
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (inGame || settingsOpen || shortcutsOpen) return;
      const key = e.key.toLowerCase();
      if (key === 's') {
        e.preventDefault();
        setSettingsOpen(true);
      } else if (key === 'p' && screen.name !== 'pilot-profile') {
        e.preventDefault();
        const from =
          screen.name === 'galaxy' || screen.name === 'campaign-map'
            ? screen.name
            : 'mode-select';
        setScreen({ name: 'pilot-profile', from });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inGame, settingsOpen, shortcutsOpen, screen.name]);

  const openSettings = () => setSettingsOpen(true);

  const selectMode = (id: GameModeId) => {
    if (id === 'campaign') setScreen({ name: 'galaxy' });
    else if (id === 'versus') setScreen({ name: 'versus' });
    else if (id === 'arcade' && arcadeUnlocked) setScreen({ name: 'arcade-briefing' });
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
            arcadeUnlocked={arcadeUnlocked}
            animateEntrance={!menuEntrancePlayed}
            onEntrancePlayed={markMenuEntrancePlayed}
            onSelectMode={selectMode}
            onOpenSettings={openSettings}
            onOpenProfile={() => setScreen({ name: 'pilot-profile', from: 'mode-select' })}
            onOpenClassroom={() => setScreen({ name: 'classroom' })}
            onOpenHangar={() => setScreen({ name: 'hangar', back: { name: 'mode-select' } })}
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
            onOpenHangar={() => setScreen({ name: 'hangar', back: screen })}
          />
        );
      }

      case 'hangar':
        return (
          <HangarScreen
            progress={progress}
            loadout={loadout}
            backLabel="Back"
            onBack={() => setScreen(screen.back)}
            onOpenSettings={openSettings}
          />
        );

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
            onStart={(options) => setScreen({ name: 'arcade-game', ...options })}
            onBack={() => setScreen({ name: 'mode-select' })}
            onOpenSettings={openSettings}
          />
        );

      case 'arcade-game': {
        const noPreview = screen.name === 'arcade-game' ? !!screen.noPreview : false;
        return (
          <ArcadeGame
            records={arcade.records}
            keyBindings={keyBindings}
            keyboardEnabled={!settingsOpen}
            externallyPaused={settingsOpen}
            reducedMotion={reducedMotion}
            noPreview={noPreview}
            onOpenSettings={openSettings}
            onRecordRun={(run) => {
              arcade.recordRun(run);
              const xpEarned = computeArcadeXp(run.score, noPreview);
              if (xpEarned > 0) {
                progress.earnArcadeXp(xpEarned);
              }
            }}
            onExit={() => setScreen({ name: 'mode-select' })}
          />
        );
      }

      case 'versus-match':
        return (
          <VersusMatchScreen
            matchId={screen.matchId}
            seed={screen.seed}
            role={screen.role}
            opponentStudentId={screen.opponentStudentId}
            myName={getCadetName()}
            keyBindings={keyBindings}
            keyboardEnabled={!settingsOpen}
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
        // Improvement #7: tierForLevel returns a full TierDecision; we just
        // need the .tier field to pick the variant here.
        const tierDecision = progress.tierForLevel(zone, index);
        const tier = tierDecision.tier;
        return (
          <Game
            key={level.id}
            level={configForTier(level, tier)}
            tier={tier}
            zoneId={zone.id}
            title={level.name}
            levelNumberLabel={label}
            hasNext={!!nextLevelInZone(level.id)}
            keyBindings={keyBindings}
            keyboardEnabled={!settingsOpen}
            shipSkin={{ sprite: loadout.equipped.ship.sprite, hue: loadout.equipped.ship.hue }}
            laser={{
              beam: loadout.equipped.laser.beam,
              beamCore: loadout.equipped.laser.beamCore,
              width: loadout.equipped.laser.width,
              boltHue: loadout.equipped.laser.boltHue,
            }}
            themeSpace={loadout.equipped.theme.space}
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
      {/* Improvement #8: skip-to-content link for keyboard users. Hidden until
          focused so it doesn't compete with the tactical UI. */}
      <SkipLink targetId="app-main" />
      <div id="app-main" tabIndex={-1}>
        <Suspense fallback={<ScreenLoader reducedMotion={reducedMotion} />}>
          {renderScreen()}
        </Suspense>
      </div>

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

      {shortcutsOpen && (
        <KeyboardShortcutsHelp
          keyBindings={keyBindings}
          onClose={() => setShortcutsOpen(false)}
        />
      )}

    </SfxProvider>
  );
}

/**
 * Suspense fallback shown while a lazy screen chunk loads. Renders a minimal
 * "Loading…" hint so the user gets immediate feedback (especially on slow
 * school networks) instead of a blank page.
 */
function ScreenLoader({ reducedMotion }: { reducedMotion: boolean }) {
  return (
    <div
      className="app__loader"
      role="status"
      aria-live="polite"
      aria-busy="true"
      data-testid="screen-loader"
    >
      <div
        className={`app__loader-spinner${reducedMotion ? ' app__loader-spinner--reduced' : ''}`}
        aria-hidden="true"
      />
      <p>Loading…</p>
    </div>
  );
}
