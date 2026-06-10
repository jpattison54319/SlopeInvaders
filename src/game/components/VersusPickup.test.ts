import { describe, expect, it } from 'vitest';
import { coordinateLabelLayout } from './asteroidLabelLayout';
import { versusPickupCoordinateLabel } from './versusPickupLabel';

describe('Versus pickup coordinate label', () => {
  it('formats the pickup point like asteroid coordinates', () => {
    expect(
      versusPickupCoordinateLabel({
        id: 'pickup-1',
        point: { x: -7, y: 6 },
        kind: 'freeze',
      }),
    ).toBe('(-7, 6)');
  });

  it('allocates enough width to keep the full coordinate on one line', () => {
    const label = versusPickupCoordinateLabel({
      id: 'pickup-2',
      point: { x: -7, y: -7 },
      kind: 'add',
    });
    const layout = coordinateLabelLayout(label, 18, 11);

    expect(layout.width).toBeGreaterThan(18);
    expect(layout.wrap).toBe('none');
  });
});
