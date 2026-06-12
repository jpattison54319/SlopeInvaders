import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Zone } from '../../game/campaign/types';
import { planetSrcForZone } from '../../game/campaign/planets';
import { ScreenChrome } from '../ScreenChrome';
import type { CampaignProgress } from '../useCampaignProgress';
import { TacticalButton } from '../../game/components/TacticalButton';
import { TacticalPanel, TacticalStatusRail } from '../../game/components/TacticalPanel';
import { PlanetDial } from './PlanetDial';
import { PlanetSurfaceMap } from './PlanetSurfaceMap';

interface GalaxyMapScreenProps {
  zones: Zone[];
  progress: CampaignProgress;
  /** Open the dial centered on this zone (e.g. when returning from a level). */
  initialZoneId?: string;
  onPlayLevel: (levelId: string) => void;
  onBack: () => void;
  onOpenSettings: () => void;
  /** Toggle to the classic zone/level list screens. */
  onToggleView: () => void;
  /** Open the Pilot Profile (XP, badges, mastery, flight log). */
  onOpenProfile: () => void;
  toggleViewIcon?: 'list';
}

type SurfacePhase = 'space' | 'approach' | 'surface' | 'leaving';

/** The furthest zone the player can currently reach (defaults the dial there). */
function furthestUnlocked(zones: Zone[], progress: CampaignProgress): number {
  let idx = 0;
  for (let i = 0; i < zones.length; i++) {
    if (progress.isZoneUnlocked(zones[i].id)) idx = i;
  }
  return idx;
}

/** The atmospheric galaxy: a planet dial whose center planet holds level hotspots. */
export function GalaxyMapScreen({
  zones,
  progress,
  initialZoneId,
  onPlayLevel,
  onBack,
  onOpenSettings,
  onToggleView,
  onOpenProfile,
  toggleViewIcon = 'list',
}: GalaxyMapScreenProps) {
  const initialIndex = useMemo(() => {
    const fromId = initialZoneId ? zones.findIndex((z) => z.id === initialZoneId) : -1;
    return fromId >= 0 ? fromId : furthestUnlocked(zones, progress);
    // Only compute the starting index once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [surfacePhase, setSurfacePhase] = useState<SurfacePhase>('space');

  const activeZone = zones[activeIndex];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= zones.length) return;
      setActiveIndex(index);
      setSurfacePhase('space');
    },
    [zones.length],
  );

  const rotate = useCallback((dir: number) => goTo(activeIndex + dir), [goTo, activeIndex]);

  useEffect(() => {
    if (surfacePhase !== 'approach' && surfacePhase !== 'leaving') return;
    const id = window.setTimeout(
      () => setSurfacePhase(surfacePhase === 'approach' ? 'surface' : 'space'),
      surfacePhase === 'approach' ? 560 : 420,
    );
    return () => window.clearTimeout(id);
  }, [surfacePhase]);

  // Arrow keys rotate the dial; Escape leaves the planet surface.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (surfacePhase === 'space') rotate(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (surfacePhase === 'space') rotate(1);
      } else if (e.key === 'Escape') {
        if (surfacePhase === 'surface') setSurfacePhase('leaving');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [rotate, surfacePhase]);

  const locked = activeZone.status !== 'available' || !progress.isZoneUnlocked(activeZone.id);
  const showProgressSummary = !locked && activeZone.status === 'available' && activeZone.levels.length > 0;
  const statusNote =
    activeZone.status !== 'available'
      ? 'Coming Soon'
      : locked
        ? 'Locked — clear the previous planet'
        : activeZone.levels.length === 0
          ? ''
          : `${progress.zoneClearedCount(activeZone.id)} / ${activeZone.levels.length} missions cleared`;
  const acquiredStars = showProgressSummary
    ? activeZone.levels.reduce((sum, level) => sum + progress.getLevelStars(level.id), 0)
    : 0;
  const totalStars = activeZone.levels.length * 3;

  const canEnter = !locked && activeZone.levels.length > 0;
  const showingSurface = surfacePhase === 'surface' || surfacePhase === 'leaving';
  const enterPlanet = () => {
    if (!canEnter) return;
    setSurfacePhase('approach');
  };
  const backFromSurface = () => {
    if (surfacePhase === 'space') {
      onBack();
    } else if (surfacePhase === 'approach') {
      setSurfacePhase('space');
    } else {
      setSurfacePhase('leaving');
    }
  };

  return (
    <ScreenChrome
      onBack={backFromSurface}
      backLabel={surfacePhase === 'space' ? 'Modes' : 'Planets'}
      onOpenSettings={onOpenSettings}
      onToggleView={onToggleView}
      toggleViewLabel="List view"
      toggleViewIcon={toggleViewIcon}
      onOpenProfile={onOpenProfile}
    >
      <section
        className={`galaxy ${showingSurface ? 'galaxy--surface' : ''}`}
        aria-labelledby="galaxy-title"
      >
        {!showingSurface && (
          <div className="galaxy__header">
            <div>
              <span className="menu__panel-label">Campaign · Galaxy</span>
              <h2 id="galaxy-title">Choose your destination</h2>
            </div>
            <span className="galaxy__sector-code">NAV // {String(activeIndex + 1).padStart(2, '0')}</span>
          </div>
        )}

        {!showingSurface && (
          <>
            <div className={`galaxy__stage ${surfacePhase === 'approach' ? 'galaxy__stage--approach' : ''}`}>
              <TacticalButton
                asset="back"
                size="medium"
                className="galaxy-nav-arrow galaxy-nav-arrow--left"
                label="Previous planet"
                disabled={activeIndex === 0 || surfacePhase !== 'space'}
                onClick={() => rotate(-1)}
              />

              <PlanetDial
                zones={zones}
                activeIndex={activeIndex}
                progress={progress}
                onRotateTo={goTo}
                onEnterCenter={enterPlanet}
              />

              <TacticalButton
                asset="forward"
                size="medium"
                className="galaxy-nav-arrow galaxy-nav-arrow--right"
                label="Next planet"
                disabled={activeIndex === zones.length - 1 || surfacePhase !== 'space'}
                onClick={() => rotate(1)}
              />
            </div>

            <TacticalPanel className="galaxy__console" tone={locked ? 'standard' : 'gold'} aria-live="polite">
              <div className="galaxy__caption">
                <strong>
                  {activeZone.number === 0 ? activeZone.name : `Zone ${activeZone.number}: ${activeZone.name}`}
                </strong>
                <span>{activeZone.theme}</span>
                {statusNote && <span className="galaxy__status">{statusNote}</span>}
              </div>
              <TacticalStatusRail
                label="Campaign navigation status"
                items={[
                  { label: 'Pilot XP', value: progress.getTotalXp() },
                  {
                    label: 'Missions',
                    value: showProgressSummary
                      ? `${progress.zoneClearedCount(activeZone.id)}/${activeZone.levels.length}`
                      : locked
                        ? 'Locked'
                        : '—',
                  },
                  {
                    label: 'Mastery',
                    value: showProgressSummary ? `${acquiredStars}/${totalStars}` : '—',
                  },
                ]}
              />
            </TacticalPanel>
          </>
        )}

        {showingSurface && (
          <PlanetSurfaceMap
            zone={activeZone}
            progress={progress}
            planetSrc={planetSrcForZone(activeZone.id)}
            exiting={surfacePhase === 'leaving'}
            onPlayLevel={onPlayLevel}
          />
        )}
      </section>
    </ScreenChrome>
  );
}
