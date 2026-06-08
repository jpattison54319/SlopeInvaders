import { describe, expect, it } from 'vitest';
import { factionBanners } from '../../assets/assetMap';
import { missionPathLayout } from './planets';

describe('campaign planet mission path layout', () => {
  it('centers a single mission on the planet face', () => {
    expect(missionPathLayout('tutorial', 1)).toEqual([
      expect.objectContaining({ x: 0.5, y: 0.56 }),
    ]);
  });

  it('places multi-mission zones left to right while varying height', () => {
    const points = missionPathLayout('zone-1', 4);

    expect(points).toHaveLength(4);
    expect(points.map((p) => p.x)).toEqual([...points.map((p) => p.x)].sort((a, b) => a - b));
    expect(new Set(points.map((p) => p.y)).size).toBeGreaterThan(2);
  });

  it('keeps mission markers within the conservative planet safe area', () => {
    const center = 0.5;
    const safeRadius = 0.31;

    for (const point of missionPathLayout('zone-1', 4)) {
      const dx = point.x - center;
      const dy = point.y - center;
      expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThanOrEqual(safeRadius);
    }
  });

  it('does not repeat faction banners within Zone 1', () => {
    const points = missionPathLayout('zone-1', 4);
    const used = points.map((p) => p.bannerKey);

    expect(new Set(used).size).toBe(used.length);
    for (const key of used) {
      expect(factionBanners[key]).toBeTruthy();
    }
  });
});
