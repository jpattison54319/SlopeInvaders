/**
 * Galaxy mission-select mapping: which planet sprite represents each zone, and
 * where a zone's level "hotspots" sit on the planet face.
 *
 * Kept separate from the `Zone` data model (and its tests) so adding the galaxy
 * UI needs no campaign-schema change — assignments live here by zone id.
 */
import {
  factionBanners,
  planets,
  type FactionBannerKey,
  type PlanetKey,
} from '../../assets/assetMap';

/** Default planet per zone id. Falls back to a stable choice for unknown ids. */
const ZONE_PLANETS: Record<string, PlanetKey> = {
  tutorial: 'mooncolony',
  'zone-1': 'spacegarden',
  'zone-2': 'crystal',
  'zone-3': 'volcano',
  'zone-4': 'celestial',
  // Placeholders: reuse existing sprites until dedicated art ships for Zones 5–8.
  'zone-5': 'mooncolony',
  'zone-6': 'volcano',
  'zone-7': 'crystal',
  'zone-8': 'celestial',
  'zone-9': 'spacegarden',
};

const PLANET_KEYS = Object.keys(planets) as PlanetKey[];

/** The planet sprite key for a zone (deterministic fallback if unmapped). */
export function planetKeyForZone(zoneId: string): PlanetKey {
  if (ZONE_PLANETS[zoneId]) return ZONE_PLANETS[zoneId];
  // Stable fallback: hash the id into the available planet list.
  let h = 0;
  for (let i = 0; i < zoneId.length; i++) h = (h * 31 + zoneId.charCodeAt(i)) >>> 0;
  return PLANET_KEYS[h % PLANET_KEYS.length];
}

/** Resolved planet sprite URL for a zone. */
export function planetSrcForZone(zoneId: string): string {
  return planets[planetKeyForZone(zoneId)];
}

/** A hotspot position as a fraction (0..1) of the planet box, from top-left. */
export interface HotspotPos {
  x: number;
  y: number;
}

export interface MissionPathPoint extends HotspotPos {
  bannerKey: FactionBannerKey;
}

const BANNER_KEYS = Object.keys(factionBanners) as FactionBannerKey[];
// The planet dome is bordered on top and sides only and is pushed partly below
// the fold, so markers must stay in the upper-middle band to read as "on the
// planet". Horizontally the face is centered at 0.5; vertically the safe band is
// centered higher (0.44) with a conservative radius.
const SAFE_CENTER_X = 0.5;
const SAFE_CENTER_Y = 0.44;
const SAFE_RADIUS = 0.3;
const PATH_MIN_X = 0.24;
const PATH_MAX_X = 0.76;
const BANNER_STEP = 7;
const PATH_Y_PATTERN = [0.48, 0.34, 0.5, 0.38, 0.32, 0.44];

function stableHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function round(n: number): number {
  return Number(n.toFixed(3));
}

/** Clamp a point into the planet's safe ellipse (centered high, full-width). */
function clampToPlanetFace(x: number, y: number): HotspotPos {
  const dx = x - SAFE_CENTER_X;
  const dy = y - SAFE_CENTER_Y;
  const maxAbsDy = Math.sqrt(Math.max(0, SAFE_RADIUS * SAFE_RADIUS - dx * dx));
  const safeY = Math.abs(dy) > maxAbsDy ? SAFE_CENTER_Y + Math.sign(dy) * maxAbsDy : y;
  return { x: round(x), y: round(safeY) };
}

/**
 * Deterministic left-to-right mission path across the active planet face.
 * Positions are normalized and clamped to a conservative inner planet ellipse so
 * larger banner art has room to stay visually planted on the planet.
 */
export function missionPathLayout(zoneId: string, count: number): MissionPathPoint[] {
  if (count <= 0) return [];
  const bannerOffset = stableHash(zoneId) % BANNER_KEYS.length;
  const bannerFor = (i: number) => BANNER_KEYS[(bannerOffset + i * BANNER_STEP) % BANNER_KEYS.length];

  if (count === 1) {
    const isTutorial = zoneId === 'tutorial';
    return [{ x: isTutorial ? 0.253 : 0.5, y: isTutorial ? 0.561 : 0.42, bannerKey: bannerFor(0) }];
  }

  const out: MissionPathPoint[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const x = PATH_MIN_X + t * (PATH_MAX_X - PATH_MIN_X);
    const pos = clampToPlanetFace(x, PATH_Y_PATTERN[i % PATH_Y_PATTERN.length]);
    out.push({ ...pos, bannerKey: bannerFor(i) });
  }
  return out;
}

/** Backwards-compatible position-only view for popup and tests that need x/y. */
export function hotspotLayout(count: number): HotspotPos[] {
  return missionPathLayout('default', count).map(({ x, y }) => ({ x, y }));
}
