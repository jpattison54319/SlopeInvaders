/**
 * Campaign zone registry + navigation helpers.
 *
 * Tutorial + Zones 1–8 are fully built. To add a future zone, build its level
 * file and append it here; `comingSoonZone` (below) makes a locked stub for any
 * zone whose levels aren't ready yet (give it real `levels` + `status:
 * 'available'` to ship it).
 */
import type { CampaignLevel, Zone } from './types';
import { tutorialZone } from './levels/tutorial';
import { zoneOne } from './levels/zone1';
import { zoneTwo } from './levels/zone2';
import { zoneThree } from './levels/zone3';
import { zoneFour } from './levels/zone4';
import { zoneFive } from './levels/zone5';
import { zoneSix } from './levels/zone6';
import { zoneSeven } from './levels/zone7';
import { zoneEight } from './levels/zone8';
import { zoneNine } from './levels/zone9';

/** A locked placeholder for a zone whose levels aren't built yet. */
export function comingSoonZone(id: string, number: number, name: string, theme: string): Zone {
  return { id, number, name, theme, status: 'coming-soon', levels: [] };
}

export const zones: Zone[] = [
  tutorialZone,
  zoneOne,
  zoneTwo,
  zoneThree,
  zoneFour,
  zoneFive,
  zoneSix,
  zoneSeven,
  zoneEight,
  zoneNine,
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
