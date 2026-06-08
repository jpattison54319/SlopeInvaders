import type { CSSProperties } from 'react';
import { factionBanners } from '../../assets/assetMap';
import type { Zone } from '../../game/campaign/types';
import { missionPathLayout } from '../../game/campaign/planets';
import type { CampaignProgress } from '../useCampaignProgress';

interface PlanetSurfaceMapProps {
  zone: Zone;
  progress: CampaignProgress;
  planetSrc: string;
  exiting: boolean;
  onPlayLevel: (levelId: string) => void;
}

const REGION_SHAPES = [
  '8,56 23,44 38,52 35,76 12,79',
  '27,32 49,25 60,43 48,60 29,54',
  '47,52 66,38 84,47 77,72 55,72',
  '64,23 88,18 96,36 86,54 68,45',
  '10,25 29,15 42,28 31,43 13,42',
  '35,67 53,59 68,74 58,90 37,87',
];

const SURFACE_MARKERS = [
  { x: 0.21, y: 0.63 },
  { x: 0.44, y: 0.45 },
  { x: 0.67, y: 0.6 },
  { x: 0.82, y: 0.34 },
  { x: 0.25, y: 0.31 },
  { x: 0.52, y: 0.78 },
];

function markerFor(index: number, total: number) {
  if (index < SURFACE_MARKERS.length) return SURFACE_MARKERS[index];
  const t = total <= 1 ? 0.5 : index / (total - 1);
  return {
    x: 0.14 + t * 0.72,
    y: 0.34 + (index % 3) * 0.16,
  };
}

function regionFor(index: number) {
  return REGION_SHAPES[index % REGION_SHAPES.length];
}

export function PlanetSurfaceMap({
  zone,
  progress,
  planetSrc,
  exiting,
  onPlayLevel,
}: PlanetSurfaceMapProps) {
  const path = missionPathLayout(zone.id, zone.levels.length);
  const style = { '--planet-texture': `url(${planetSrc})` } as CSSProperties;

  return (
    <div className={`planet-surface ${exiting ? 'planet-surface--leaving' : ''}`} style={style}>
      <div className="planet-surface__hud">
        <span className="menu__panel-label">Campaign · Surface</span>
        <h2>{zone.number === 0 ? `${zone.name} Surface` : `Zone ${zone.number}: ${zone.name} Surface`}</h2>
      </div>

      <div className="planet-surface__globe">
        <svg className="planet-surface__regions" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {zone.levels.map((level, i) => {
            const complete = progress.isLevelComplete(level.id);
            const unlocked = progress.isLevelUnlocked(zone, i);
            const state = complete ? 'cleared' : unlocked ? 'ready' : 'locked';
            return (
              <polygon
                key={level.id}
                className={`surface-region surface-region--${state}`}
                points={regionFor(i)}
              />
            );
          })}
        </svg>

        {zone.levels.map((level, i) => {
          const complete = progress.isLevelComplete(level.id);
          const unlocked = progress.isLevelUnlocked(zone, i);
          const state = complete ? 'cleared' : unlocked ? 'ready' : 'locked';
          const marker = markerFor(i, zone.levels.length);
          const banner = path[i];

          return (
            <button
              key={level.id}
              type="button"
              className={`surface-banner surface-banner--${state}`}
              style={{ left: `${marker.x * 100}%`, top: `${marker.y * 100}%` }}
              disabled={!unlocked}
              aria-label={`${level.name} — ${state}`}
              onClick={() => onPlayLevel(level.id)}
            >
              <img src={factionBanners[banner.bannerKey]} alt="" draggable={false} />
              <span className="surface-banner__label">L{i + 1}</span>
              {complete && <span className="surface-check" aria-hidden="true">✓</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
