/**
 * Campaign zone registry + navigation helpers.
 *
 * Tutorial + Zone 1 are fully built; later zones are `coming-soon` stubs so the
 * Campaign map is future-proof (give a stub real `levels` and flip `status` to
 * 'available' to ship it).
 */
import type { CampaignLevel, Zone } from './types';
import { tutorialZone } from './levels/tutorial';
import { zoneOne } from './levels/zone1';
import { zoneTwo } from './levels/zone2';

function comingSoonZone(id: string, number: number, name: string, theme: string): Zone {
  return { id, number, name, theme, status: 'coming-soon', levels: [] };
}

export const zones: Zone[] = [
  tutorialZone,
  zoneOne,
  zoneTwo,
  comingSoonZone('zone-3', 3, 'Negative Slopes', 'Lines that fall'),
  comingSoonZone('zone-4', 4, 'Four Quadrants', 'The full coordinate grid'),
];

/** Flat, ordered list of every playable level across available zones. */
export const orderedLevels: { zone: Zone; level: CampaignLevel }[] = zones
  .filter((z) => z.status === 'available')
  .flatMap((z) => z.levels.map((level) => ({ zone: z, level })));

export const firstCampaignLevel = orderedLevels[0];

export function findZone(zoneId: string): Zone | undefined {
  return zones.find((z) => z.id === zoneId);
}

export function findCampaignLevel(
  levelId: string,
): { zone: Zone; level: CampaignLevel; index: number } | undefined {
  for (const zone of zones) {
    const index = zone.levels.findIndex((l) => l.id === levelId);
    if (index >= 0) return { zone, level: zone.levels[index], index };
  }
  return undefined;
}

/** The next playable level, crossing zone boundaries; undefined at the end. */
export function nextLevel(levelId: string): { zone: Zone; level: CampaignLevel } | undefined {
  const idx = orderedLevels.findIndex((e) => e.level.id === levelId);
  if (idx < 0 || idx + 1 >= orderedLevels.length) return undefined;
  return orderedLevels[idx + 1];
}

/**
 * The next level within the SAME zone; undefined at a zone's last level. Used to
 * keep "Next Level" inside a zone so the end-of-zone learning check runs before
 * crossing into the next zone.
 */
export function nextLevelInZone(
  levelId: string,
): { zone: Zone; level: CampaignLevel } | undefined {
  const ctx = findCampaignLevel(levelId);
  if (!ctx) return undefined;
  const next = ctx.zone.levels[ctx.index + 1];
  return next ? { zone: ctx.zone, level: next } : undefined;
}
