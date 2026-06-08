import { describe, it, expect } from 'vitest';
import {
  nextLevel,
  nextLevelInZone,
  findCampaignLevel,
  orderedLevels,
  firstCampaignLevel,
} from './zones';

describe('campaign navigation', () => {
  it('starts at the tutorial level', () => {
    expect(firstCampaignLevel.level.id).toBe('tut-1');
    expect(firstCampaignLevel.zone.id).toBe('tutorial');
  });

  it('orderedLevels covers the tutorial, all of zone 1, then all of zone 2', () => {
    expect(orderedLevels.map((e) => e.level.id)).toEqual([
      'tut-1',
      'z1-l1',
      'z1-l2',
      'z1-l3',
      'z1-l4',
      'z2-l1',
      'z2-l2',
      'z2-l3',
      'z2-l4',
      'z2-l5',
    ]);
  });

  it('nextLevel crosses the tutorial → zone-1 boundary', () => {
    const next = nextLevel('tut-1');
    expect(next?.level.id).toBe('z1-l1');
    expect(next?.zone.id).toBe('zone-1');
  });

  it('nextLevel crosses the zone-1 → zone-2 boundary', () => {
    const next = nextLevel('z1-l4');
    expect(next?.level.id).toBe('z2-l1');
    expect(next?.zone.id).toBe('zone-2');
  });

  it('nextLevel advances within a zone', () => {
    expect(nextLevel('z1-l1')?.level.id).toBe('z1-l2');
    expect(nextLevel('z1-l3')?.level.id).toBe('z1-l4');
  });

  it('nextLevel is undefined at the end of available content', () => {
    expect(nextLevel('z2-l5')).toBeUndefined();
  });

  it('nextLevelInZone advances within a zone but stops at the zone boundary', () => {
    expect(nextLevelInZone('z1-l1')?.level.id).toBe('z1-l2');
    expect(nextLevelInZone('z2-l1')?.level.id).toBe('z2-l2');
    // Last level of a zone has no in-zone successor (so the debrief runs instead).
    expect(nextLevelInZone('z1-l4')).toBeUndefined();
    expect(nextLevelInZone('z2-l5')).toBeUndefined();
    expect(nextLevelInZone('tut-1')).toBeUndefined();
  });

  it('findCampaignLevel returns the owning zone and index', () => {
    const found = findCampaignLevel('z1-l3');
    expect(found?.zone.id).toBe('zone-1');
    expect(found?.index).toBe(2);
    expect(findCampaignLevel('nope')).toBeUndefined();
  });
});
