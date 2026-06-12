import { describe, expect, it } from 'vitest';
import { factionBanners } from '../../assets/assetMap';
import { missionPathLayout } from './planets';

describe('campaign planet mission path layout', () => {
  it('positions the single tutorial mission inside the bottom-left bordered region', () => {
    expect(missionPathLayout('tutorial', 1)).toEqual([
      expect.objectContaining({ x: 0.253, y: 0.561 }),
    ]);
  });

  it('places multi-mission zones left to right while varying height', () => {
    const points = missionPathLayout('zone-1', 4);

    expect(points).toHaveLength(4);
    expect(points.map((p) => p.x)).toEqual([...points.map((p) => p.x)].sort((a, b) => a - b));
    expect(new Set(points.map((p) => p.y)).size).toBeGreaterThan(2);
  });

  it('keeps mission markers within the conservative planet safe area', () => {
    // Safe ellipse is centered horizontally at 0.5 and vertically high (0.44),
    // so banners read as planted on the visible upper dome (not the open bottom).
    const centerX = 0.5;
    const centerY = 0.44;
    const safeRadius = 0.305;

    for (const zone of ['zone-1', 'zone-2', 'zone-8'] as const) {
      const count = zone === 'zone-1' ? 4 : 5;
      for (const point of missionPathLayout(zone, count)) {
        const dx = point.x - centerX;
        const dy = point.y - centerY;
        expect(Math.sqrt(dx * dx + dy * dy)).toBeLessThanOrEqual(safeRadius);
        // And never in the lower (un-bordered) part of the dome.
        expect(point.y).toBeLessThanOrEqual(0.55);
      }
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
