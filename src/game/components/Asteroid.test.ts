import { describe, expect, it } from 'vitest';
import { coordinateLabelLayout } from './asteroidLabelLayout';

describe('asteroid coordinate label layout', () => {
  it('gives multi-character coordinates enough width to render on one line', () => {
    const layout = coordinateLabelLayout('(-3, -3)', 36);

    expect(layout.width).toBeGreaterThan(36);
    expect(layout.wrap).toBe('none');
  });

  it('keeps the wider label centered under the asteroid', () => {
    const layout = coordinateLabelLayout('(10, -10)', 40);
    const centerX = 120;

    expect(centerX + layout.xOffset + layout.width / 2).toBeCloseTo(centerX);
  });
});
